import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid
from datetime import datetime

load_dotenv()

class DatabaseManager:
    def __init__(self):
        url: str = os.environ.get("VITE_SUPABASE_URL")
        key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("Missing Supabase URL or API key in environment variables")
        self.supabase: Client = create_client(url, key)
    
    # Profile operations
    def create_profile(self, user_id: str, email: str, full_name: str) -> Dict[str, Any]:
        """Create user profile"""
        try:
            response = self.supabase.table("profiles").insert({
                "user_id": user_id,
                "email": email,
                "full_name": full_name
            }).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Profile created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create profile"
            }
    
    def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get profile by user_id"""
        try:
            response = self.supabase.table("profiles").select("*").eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting profile: {e}")
            return None
    
    # Application operations
    def create_application(self, applicant_id: str, role_id: str, organization_id: str, 
                          resume_file_path: str) -> Dict[str, Any]:
        """Create new application"""
        try:
            response = self.supabase.table("applications").insert({
                "applicant_id": applicant_id,
                "role_id": role_id,
                "organization_id": organization_id,
                "resume_file_path": resume_file_path,
                "status": "submitted"
            }).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Application created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create application"
            }
    
    def get_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Get application by ID"""
        try:
            response = self.supabase.table("applications").select("*").eq("id", application_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting application: {e}")
            return None
    
    def update_application_status(self, application_id: str, status: str) -> Dict[str, Any]:
        """Update application status"""
        try:
            response = self.supabase.table("applications").update({
                "status": status
            }).eq("id", application_id).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Application status updated"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update application status"
            }
    
    # Questions operations
    def get_questions(self, role_id: str, organization_id: str) -> List[Dict[str, Any]]:
        """Get questions filtered by role and organization"""
        try:
            response = self.supabase.table("questions").select("*").eq("role_id", role_id).eq("organization_id", organization_id).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting questions: {e}")
            return []
    
    # Question reviews operations
    def create_question_review(self, application_id: str, questions: List[Dict]) -> Dict[str, Any]:
        """Create question review with pending status"""
        try:
            response = self.supabase.table("question_reviews").insert({
                "application_id": application_id,
                "questions": questions,
                "status": "pending"
            }).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Question review created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create question review"
            }
    
    def get_question_review(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Get question review by application ID"""
        try:
            response = self.supabase.table("question_reviews").select("*").eq("application_id", application_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting question review: {e}")
            return None
    
    def approve_question_review(self, review_id: str, reviewer_id: str = None) -> Dict[str, Any]:
        """Approve question review"""
        try:
            response = self.supabase.table("question_reviews").update({
                "status": "approved",
                "reviewer_id": reviewer_id,
                "reviewed_at": datetime.utcnow().isoformat()
            }).eq("id", review_id).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Question review approved"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to approve question review"
            }
    
    # Candidate references operations
    def save_candidate_references(self, application_id: str, references: List[Dict]) -> Dict[str, Any]:
        """Save extracted references for an application"""
        try:
            reference_records = []
            for ref in references:
                record = {
                    "application_id": application_id,
                    "name": ref.get("name"),
                    "email": ref.get("email"),
                    "company": ref.get("company"),
                    "worked_together": ref.get("worked_together_context"),
                    "year": ref.get("year")
                }
                reference_records.append(record)
            
            if reference_records:
                response = self.supabase.table("candidate_references").insert(reference_records).execute()
                return {
                    "success": True,
                    "data": response.data,
                    "message": f"Saved {len(reference_records)} references"
                }
            else:
                return {
                    "success": True,
                    "data": [],
                    "message": "No references to save"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to save references"
            }
    
    def get_candidate_references(self, application_id: str) -> List[Dict[str, Any]]:
        """Get candidate references for an application"""
        try:
            response = self.supabase.table("candidate_references").select("*").eq("application_id", application_id).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting candidate references: {e}")
            return []
    
    # Reference requests operations
    def create_reference_requests(self, application_id: str, questions: List[Dict]) -> Dict[str, Any]:
        """Create reference requests for all references of an application"""
        try:
            references = self.get_candidate_references(application_id)
            request_records = []
            
            for ref in references:
                record = {
                    "candidate_reference_id": ref["id"],
                    "questions": questions,
                    "status": "queued"
                }
                request_records.append(record)
            
            if request_records:
                response = self.supabase.table("reference_requests").insert(request_records).execute()
                return {
                    "success": True,
                    "data": response.data,
                    "message": f"Created {len(request_records)} reference requests"
                }
            else:
                return {
                    "success": True,
                    "data": [],
                    "message": "No reference requests to create"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create reference requests"
            }
    
    def get_reference_requests(self, application_id: str) -> List[Dict[str, Any]]:
        """Get reference requests for an application"""
        try:
            response = self.supabase.table("reference_requests").select("""
                *,
                candidate_references:candidate_reference_id (
                    name, email, company
                )
            """).eq("candidate_references.application_id", application_id).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting reference requests: {e}")
            return []