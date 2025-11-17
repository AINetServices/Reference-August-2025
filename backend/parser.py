import os
from typing import Dict, Any, Optional
import PyPDF2
import docx
from groq import Groq
from dotenv import load_dotenv
import json
import re

load_dotenv()

class ResumeParser:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("Missing GROQ_API_KEY in environment variables")
        
        self.groq_client = Groq(api_key=api_key)
        self.model_name = "llama3-70b-8192"
    
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file content"""
        try:
            import io
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file content"""
        try:
            import io
            doc = docx.Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
            return ""
    
    def extract_text_from_file(self, file_content: bytes, file_extension: str) -> str:
        """Extract text based on file extension"""
        if file_extension.lower() == '.pdf':
            return self.extract_text_from_pdf(file_content)
        elif file_extension.lower() in ['.docx', '.doc']:
            return self.extract_text_from_docx(file_content)
        else:
            return str(file_content, 'utf-8', errors='ignore')
    
    def parse_resume_with_groq(self, resume_text: str) -> Dict[str, Any]:
        """Parse resume text using Groq LLM to extract structured data"""
        
        system_prompt = "You are an assistant that extracts structured referee data from resumes."
        
        user_prompt = f"""Resume text:
{resume_text}

Return JSON with this exact schema:
{{
  "full_name": string | null,
  "references": [
    {{
      "name": string | null,
      "email": string | null,
      "company": string | null,
      "worked_together_context": string | null,
      "year": string | null
    }}
  ]
}}

- Always return valid JSON only.
- Use null for missing fields.
- No explanations."""

        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model_name,
                temperature=0.1,
                max_tokens=2048,
            )
            
            response_content = chat_completion.choices[0].message.content.strip()
            
            # Clean up response to ensure it's valid JSON
            response_content = self._clean_json_response(response_content)
            
            # Parse JSON response
            parsed_data = json.loads(response_content)
            
            # Validate structure
            if not isinstance(parsed_data, dict):
                raise ValueError("Response is not a dictionary")
            
            # Ensure required fields exist
            parsed_data.setdefault("full_name", None)
            parsed_data.setdefault("references", [])
            
            # Validate references structure
            if not isinstance(parsed_data["references"], list):
                parsed_data["references"] = []
            
            # Clean up reference objects
            cleaned_references = []
            for ref in parsed_data["references"]:
                if isinstance(ref, dict):
                    cleaned_ref = {
                        "name": ref.get("name"),
                        "email": ref.get("email"),
                        "company": ref.get("company"),
                        "worked_together_context": ref.get("worked_together_context"),
                        "year": ref.get("year")
                    }
                    cleaned_references.append(cleaned_ref)
            
            parsed_data["references"] = cleaned_references
            
            return {
                "success": True,
                "data": parsed_data,
                "message": "Resume parsed successfully"
            }
            
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"Invalid JSON response: {e}",
                "message": "Failed to parse LLM response as JSON"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to parse resume with Groq"
            }
    
    def _clean_json_response(self, response: str) -> str:
        """Clean up the LLM response to ensure valid JSON"""
        # Remove any text before the first {
        start_idx = response.find('{')
        if start_idx == -1:
            raise ValueError("No JSON object found in response")
        
        # Remove any text after the last }
        end_idx = response.rfind('}')
        if end_idx == -1:
            raise ValueError("No valid JSON object found in response")
        
        cleaned = response[start_idx:end_idx + 1]
        
        # Remove any markdown code block markers
        cleaned = re.sub(r'^```json\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        
        return cleaned.strip()
    
    def parse_resume_from_file(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """Complete resume parsing pipeline from file content"""
        try:
            # Extract file extension
            file_extension = os.path.splitext(file_path)[1]
            
            # Extract text from file
            resume_text = self.extract_text_from_file(file_content, file_extension)
            
            if not resume_text.strip():
                return {
                    "success": False,
                    "error": "No text content found in file",
                    "message": "Could not extract text from resume file"
                }
            
            # Parse with Groq
            return self.parse_resume_with_groq(resume_text)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to parse resume from file"
            }