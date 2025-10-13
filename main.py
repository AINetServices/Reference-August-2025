"""
Main FastAPI application for the Reference Checking System.
Handles resume processing, reference extraction, and question management.
"""

import os
import re
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
from dotenv import load_dotenv
from io import BytesIO
import pdfplumber
import requests
import re
from datetime import datetime


from agents.reference_checking_workflow import ReferenceCheckingWorkflow
from services.supabase_service import SupabaseService
from services.email_service import EmailService

load_dotenv()

app = FastAPI(title="Reference Checking System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add this at the top of your main.py after imports
print("🔍 Environment Variables Check:")
print(f"   SUPABASE_URL: {'✅ Set' if os.getenv('SUPABASE_URL') else '❌ Not set'}")
print(f"   SUPABASE_SERVICE_KEY: {'✅ Set' if os.getenv('SUPABASE_SERVICE_KEY') else '❌ Not set'}")
print(f"   GROQ_API_KEY: {'✅ Set' if os.getenv('GROQ_API_KEY') else '❌ Not set'}")

# Initialize services
workflow = ReferenceCheckingWorkflow()
db_service = SupabaseService()
email_service = EmailService()

class ProcessResumeRequest(BaseModel):
    resume_url: str
    role: str
    organization: str
    user_id: str
    application_id: str

class SendQuestionsRequest(BaseModel):
    application_id: str
    questions: List[str] = []
    references: List[Dict[str, Any]]

def parse_reference_data(reference_text):
    """Parse the reference text into structured data for the database"""
    print(f"🔍 Parsing reference text: {reference_text}")
    
    name = ""
    email = ""
    phone_number = ""
    company = ""
    relationship = ""

    try:
        # Clean and split the reference text
        reference_text = reference_text.strip()
        
        # Extract email using regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, reference_text)
        if email_match:
            email = email_match.group()
            # Remove email from text for cleaner parsing
            reference_text = re.sub(email_pattern, '', reference_text).strip()
        
        # Extract phone number using regex
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_match = re.search(phone_pattern, reference_text)
        if phone_match:
            phone_number = phone_match.group().strip()
            # Remove phone from text for cleaner parsing
            reference_text = re.sub(phone_pattern, '', reference_text).strip()
        
        # Split by common separators
        parts = []
        for separator in ['|', ',', ';', '-']:
            if separator in reference_text:
                parts = [part.strip() for part in reference_text.split(separator) if part.strip()]
                break
        
        if not parts:
            parts = [reference_text]
        
        # The first part is typically the name and possibly company
        if parts:
            name_company_part = parts[0]
            
            # Check if name contains company (common pattern: "Name, Company")
            if ',' in name_company_part:
                name_company_split = name_company_part.split(',', 1)
                name = name_company_split[0].strip()
                company = name_company_split[1].strip()
                
                # Clean company from any remaining email/phone artifacts
                company_words = []
                for word in company.split():
                    if '@' in word or any(char.isdigit() for char in word):
                        continue
                    company_words.append(word)
                company = ' '.join(company_words).strip()
            else:
                name = name_company_part
                company = ""
        
        # Process remaining parts for relationship and additional info
        for part in parts[1:]:
            part_lower = part.lower()
            if any(keyword in part_lower for keyword in ['relationship', 'relation', 'worked', 'manager', 'supervisor', 'colleague']):
                relationship = part.strip()
            elif not company and len(part) > 2:  # Use as company if not already set
                company = part.strip()
        
        # Final cleanup
        if '@' in name:
            name_parts = name.split()
            name = ' '.join([part for part in name_parts if '@' not in part]).strip()
        
        # Validate required fields
        if not name:
            name = "Unknown Reference"
            print("⚠️  Name not found in reference")
        
        if not email:
            print("⚠️  Email not found in reference")
        
        if not phone_number:
            print("⚠️  Phone number not found in reference")
        
        parsed_data = {
            'name': name,
            'email': email,
            'phone_number': phone_number,
            'company': company,
            'relationship': relationship
        }
        
        print(f"✅ Parsed reference data: {parsed_data}")
        return parsed_data

    except Exception as e:
        print(f"❌ Error parsing reference '{reference_text}': {e}")
        return {
            'name': reference_text[:100] if reference_text else "Unknown Reference",
            'email': '',
            'phone_number': '',
            'company': '',
            'relationship': ''
        }

def validate_extracted_data(result: Dict[str, Any]) -> Dict[str, Any]:
    """Validate that we have the minimum required data"""
    print("🔍 Validating extracted data...")
    
    if not result:
        return {"error": "No data extracted from resume"}
    
    # Get references or default to empty list
    references = result.get('references', [])
    
    # Don't fail if references are empty - this is common
    if not references:
        print("⚠️ No references found in resume - this is normal for some resumes")
        result['validated_references'] = []
        result['validation_summary'] = {
            'total_references': 0,
            'with_email': 0,
            'with_phone': 0,
            'missing_info': 0
        }
        return result
    
    # If we have references, validate them
    valid_references = []
    for i, ref in enumerate(references):
        if not ref or not ref.strip():
            continue
            
        parsed_ref = parse_reference_data(ref)
        
        # Check minimum requirements
        if not parsed_ref.get('name') or parsed_ref.get('name') == 'Unknown Reference':
            print(f"⚠️ Reference {i+1} missing valid name: {ref}")
            continue
            
        valid_references.append(parsed_ref)
    
    # Update result with validated references
    result['validated_references'] = valid_references
    result['validation_summary'] = {
        'total_references': len(valid_references),
        'with_email': sum(1 for ref in valid_references if ref.get('email')),
        'with_phone': sum(1 for ref in valid_references if ref.get('phone_number')),
        'missing_info': len(valid_references) - sum(1 for ref in valid_references if ref.get('email') or ref.get('phone_number'))
    }
    
    print(f"📊 Validation Results:")
    print(f"   Total valid references: {len(valid_references)}")
    
    return result

@app.get("/")
async def root():
    return {"message": "Reference Checking System API", "version": "1.0.0"}

@app.post("/api/process-resume")
async def process_resume(request: ProcessResumeRequest):
    try:
        print(f"🚀 Starting AI-powered resume processing for application {request.application_id}")
        print(f"📄 Resume URL: {request.resume_url}")

        # Step 1️⃣ Run AI workflow
        ai_result = None
        try:
            print("🤖 Running Groq AI workflow...")
            ai_result = await workflow.run_workflow(
                resume_url=request.resume_url,
                role=request.role,
                organization=request.organization
            )
            print(f"✅ AI workflow result: {ai_result}")
        except Exception as ai_error:
            print(f"⚠️ AI workflow failed: {ai_error}")
            ai_result = {}

        # Step 2️⃣ Download the resume
        response = requests.get(request.resume_url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download resume")

        # Step 3️⃣ Extract text for fallback parsing
        text = ""
        filename = request.resume_url.split('/')[-1].lower()

        if filename.endswith('.docx'):
            print("📝 Processing DOCX file")
            try:
                from docx import Document
                doc = Document(BytesIO(response.content))
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
            except Exception as e:
                print(f"❌ Error reading DOCX: {e}")
                text = response.content.decode('utf-8', errors='ignore')
                
        elif filename.endswith('.pdf'):
            print("📄 Processing PDF file")
            try:
                with pdfplumber.open(BytesIO(response.content)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"❌ Error reading PDF: {e}")
                text = response.content.decode('utf-8', errors='ignore')
                
        else:
            print(f"❓ Unknown file type: {filename}")
            text = response.content.decode('utf-8', errors='ignore')

        if not text.strip():
            print("⚠️ No readable text found in resume.")
            raise HTTPException(status_code=400, detail="No text found in resume")

        # Step 4️⃣ Regex fallback extraction
        print("🔍 Running regex fallback extractor...")
        email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
        # Better phone pattern - excludes years like 2020-2022
        phone_pattern = re.compile(r"(\+?61\s?)?\(?0?\)?\s?[1-9]\d{1}\s?\d{3}\s?\d{3}|04\d{2}\s?\d{3}\s?\d{3}")
        # Better name pattern - look for proper name format
        name_pattern = re.compile(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:\s|$)", re.MULTILINE)
        
        email_match = email_pattern.search(text)
        phone_match = phone_pattern.search(text)
        name_match = name_pattern.search(text[:500])  # Search only first 500 chars for name

        fallback_data = {
            "name": name_match.group(0).strip() if name_match else "",
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
        }

        print(f"🧩 Fallback extracted data: {fallback_data}")

        # Step 5️⃣ Merge AI + fallback results
        extracted_data = {
            "ai_result": ai_result,
            "fallback": fallback_data,
            "final": {
                "name": ai_result.get("name") or fallback_data["name"],
                "email": ai_result.get("email") or fallback_data["email"],
                "phone": ai_result.get("phone") or fallback_data["phone"],
                "references": ai_result.get("references", []),
                "resume_url": request.resume_url
            }
        }

        print(f"🧠 Final merged extraction: {extracted_data['final']}")

        # Step 6️⃣ Determine status
        # Check if we have any meaningful extracted data
        has_meaningful_data = any([
            extracted_data['final'].get('name') and extracted_data['final']['name'] != 'Unknown',
            extracted_data['final'].get('email') and extracted_data['final']['email'] != 'Unknown', 
            extracted_data['final'].get('phone') and extracted_data['final']['phone'] != 'Unknown',
            extracted_data['final'].get('references') and len(extracted_data['final']['references']) > 0
        ])

        status = "extracted" if has_meaningful_data else "processing"

        # Set the correct flags for frontend
        has_extracted_data = has_meaningful_data
        extracted_data_keys = "name,email,phone" if has_meaningful_data else "none"

        # Step 7️⃣ Save to Supabase
        update_result = db_service.update_application(
            application_id=request.application_id,
            extracted_data=extracted_data['final'],
            role=request.role,
            organization=request.organization,
            user_id=request.user_id,
            status=status,
            has_extracted_data=has_extracted_data,
            extracted_data_keys=extracted_data_keys
        )

        print(f"✅ Application updated in Supabase: {update_result}")

        return {
            "success": True,
            "application_id": request.application_id,
            "status": status,
            "ai_used": bool(ai_result),
            "data": extracted_data['final']
        }

    except Exception as e:
        print(f"💥 Error processing resume: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

# Email endpoints
@app.post("/api/send-reference-requests")
async def send_reference_requests(request: SendQuestionsRequest):
    """Send reference request emails for an application with specific questions"""
    try:
        print(f"📧 Sending reference requests for application {request.application_id}")
        print(f"   Questions to send: {len(request.questions)}")
        print(f"   References: {len(request.references)}")
        
        # Get application data from database
        application_response = db_service.supabase.table('applications')\
            .select('*')\
            .eq('id', request.application_id)\
            .execute()
        
        if not application_response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = application_response.data[0]
        extracted_data = application.get('extracted_data', {})
        candidate_name = extracted_data.get('name', 'The candidate')
        role = application.get('role', '')
        organization = application.get('organization', 'Camden Care & Support Services')
        
        # Use provided questions or fallback to role-specific questions from database
        questions = request.questions
        if not questions:
            print("🔄 No questions provided, fetching from database...")
            questions = await _get_questions_for_role(role)
        
        # Send emails to references
        sent_emails = []
        failed_emails = []
        
        for ref in request.references:
            if isinstance(ref, dict) and ref.get('email'):
                success = email_service.send_reference_request(
                    reference_email=ref['email'],
                    reference_name=ref.get('name', 'Reference'),
                    candidate_name=candidate_name,
                    role=role,
                    organization=organization,
                    questions=questions,
                    application_id=request.application_id
                )
                
                if success:
                    sent_emails.append({
                        'email': ref['email'],
                        'name': ref.get('name', 'Unknown')
                    })
                    
                    # Create reference request record in database
                    db_service.supabase.table('reference_requests').insert({
                        'application_id': request.application_id,
                        'reference_name': ref.get('name', 'Unknown'),
                        'reference_email': ref['email'],
                        'reference_phone': ref.get('phone_number', ''),
                        'reference_company': ref.get('company', ''),
                        'reference_relationship': ref.get('relationship', ''),
                        'status': 'sent',
                        'questions_sent': questions,
                        'sent_at': datetime.now().isoformat()
                    }).execute()
                else:
                    failed_emails.append({
                        'email': ref['email'],
                        'name': ref.get('name', 'Unknown')
                    })
            else:
                print(f"⚠️ Skipping reference without valid email: {ref}")
        
        # Update application status
        db_service.supabase.table('applications')\
            .update({
                'status': 'reference_requests_sent',
                'updated_at': datetime.now().isoformat()
            })\
            .eq('id', request.application_id)\
            .execute()
        
        return {
            "success": True,
            "application_id": request.application_id,
            "candidate_name": candidate_name,
            "role": role,
            "organization": organization,
            "questions_sent": questions,
            "sent_emails": sent_emails,
            "failed_emails": failed_emails,
            "total_sent": len(sent_emails),
            "total_failed": len(failed_emails)
        }
        
    except Exception as e:
        print(f"❌ Error sending reference requests: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending reference requests: {str(e)}")

@app.get("/api/test-email")
async def test_email():
    """Test email configuration"""
    try:
        if email_service.test_connection():
            return {"success": True, "message": "Email service is configured correctly"}
        else:
            return {"success": False, "message": "Email service configuration failed"}
    except Exception as e:
        return {"success": False, "message": f"Email test failed: {str(e)}"}

async def _get_questions_for_role(role: str) -> List[str]:
    """Get role-specific questions from database"""
    try:
        # Map role names to match your database
        role_mapping = {
            'Registered Nurse': 'Registered Nurse',
            'Assistant in Nursing (AIN)': 'Assistant in Nursing (AIN)',
            'Disability Support Worker': 'Disability Support Worker', 
            'Allied Health Professional': 'Allied Health Professional'
        }
        
        db_role_name = role_mapping.get(role, role)
        
        # Get questions for the specific role
        response = db_service.supabase.table('questions')\
            .select('question')\
            .eq('active', True)\
            .in_('role_id', 
                db_service.supabase.table('roles')
                .select('id')
                .eq('role_name', db_role_name)
            )\
            .execute()
        
        if response.data:
            questions = [q['question'] for q in response.data]
            print(f"✅ Found {len(questions)} questions for role: {db_role_name}")
            return questions
        else:
            # Fallback to general questions if no role-specific questions found
            print(f"⚠️ No questions found for role {db_role_name}, using fallback questions")
            return [
                "How long have you known the candidate and in what capacity?",
                "What were the candidate's main responsibilities while working with you?",
                "What are the candidate's greatest strengths?",
                "Are there any areas where the candidate could improve?",
                "Would you recommend this candidate for employment?"
            ]
            
    except Exception as e:
        print(f"❌ Error fetching questions for role {role}: {str(e)}")
        # Return default questions as fallback
        return [
            "How long have you known the candidate and in what capacity?",
            "What were the candidate's main responsibilities while working with you?",
            "What are the candidate's greatest strengths?",
            "Are there any areas where the candidate could improve?",
            "Would you recommend this candidate for employment?"
        ]

# 🔍 DEBUG ENDPOINTS
@app.get("/debug/applications")
async def debug_applications(user_id: str = None):
    """Debug endpoint to check applications in database"""
    try:
        if user_id:
            response = db_service.supabase.table('applications')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
        else:
            response = db_service.supabase.table('applications')\
                .select('*')\
                .order('created_at', desc=True)\
                .execute()

        return {
            "success": True,
            "count": len(response.data),
            "applications": response.data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/candidate-references")
async def debug_candidate_references(candidate_id: str = None):
    """Debug endpoint to check candidate_references in database"""
    try:
        if candidate_id:
            response = db_service.supabase.table('candidate_references')\
                .select('*')\
                .eq('candidate_id', candidate_id)\
                .execute()
        else:
            response = db_service.supabase.table('candidate_references')\
                .select('*')\
                .execute()

        return {
            "success": True,
            "count": len(response.data),
            "candidate_references": response.data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/reference-requests")
async def debug_reference_requests():
    """Debug endpoint to check reference_requests in database"""
    try:
        response = db_service.supabase.table('reference_requests')\
            .select('*')\
            .execute()

        return {
            "success": True,
            "count": len(response.data),
            "reference_requests": response.data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/workflow-test")
async def debug_workflow_test(resume_url: str, role: str, organization: str):
    """Test the workflow directly"""
    try:
        result = await workflow.run_workflow(
            resume_url=resume_url,
            role=role,
            organization=organization
        )
        
        # Validate the result
        validated_result = validate_extracted_data(result)
        
        return {
            "success": True, 
            "raw_result": result,
            "validated_result": validated_result
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Reference Checking System is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)