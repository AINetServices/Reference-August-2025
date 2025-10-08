"""
Custom tools for interacting with Supabase database.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from langchain.tools import BaseTool
from supabase import create_client, Client
from pydantic import BaseModel, Field

# Set up logging
logger = logging.getLogger(__name__)

# Define input schemas for each tool
class QuestionFetcherInput(BaseModel):
    role: str = Field(description="The role to fetch questions for")
    organization: str = Field(description="The organization to fetch questions for")


class DatabaseUpdateInput(BaseModel):
    action: str = Field(description="The database action to perform")
    kwargs: Dict[str, Any] = Field(default={}, description="Additional parameters for the action")


def create_question_fetcher_tool():
    """Create a question fetcher tool with improved error handling"""
    
    def fetch_questions(role: str, organization: str) -> List[str]:
        """Fetch questions for a specific role and organization"""
        try:
            supabase = create_client(
                os.getenv("SUPABASE_URL"),
                os.getenv("SUPABASE_SERVICE_KEY")
            )
            
            # FIXED: Using correct column name 'question' instead of 'questions'
            response = supabase.table('questions').select('question').eq('role', role).eq('organization', organization).execute()

            if response.data:
                # FIXED: Using correct column name 'question' instead of 'questions'
                questions_data = response.data[0]['question']
                if isinstance(questions_data, list):
                    return questions_data
                elif isinstance(questions_data, str):
                    return json.loads(questions_data)

            # Fallback to generic questions if specific ones not found   
            return _get_generic_questions(role)

        except Exception as e:
            logger.error(f"Error fetching questions: {str(e)}")
            # Return generic questions as fallback
            return _get_generic_questions(role if role else "default")
    
    return fetch_questions


def create_database_updater_tool():
    """Create a database updater tool with better validation"""
    
    def update_database(action: str, **kwargs) -> Dict[str, Any]:
        """Perform database operations based on action type"""
        try:
            # Validate action parameter
            valid_actions = ["update_application", "create_references", "update_status"]
            if action not in valid_actions:
                return {"error": f"Invalid action: {action}. Must be one of {valid_actions}"}
            
            supabase = create_client(
                os.getenv("SUPABASE_URL"),
                os.getenv("SUPABASE_SERVICE_KEY")
            )
            
            if action == "update_application":
                return _update_application(supabase, **kwargs)
            elif action == "create_references":
                return _create_references(supabase, **kwargs)
            elif action == "update_status":
                return _update_status(supabase, **kwargs)
                
        except Exception as e:
            logger.error(f"Database operation failed: {str(e)}")
            return {"error": f"Database operation failed: {str(e)}"}
    
    return update_database


# Improved helper functions
def _get_generic_questions(role: str) -> List[str]:
    """Return generic questions based on role category with better safety"""
    if not role or not isinstance(role, str):
        role = "default"
    
    role_lower = role.lower()

    generic_questions = {
        "software": [
            "How would you rate the candidate's technical skills and problem-solving abilities?",
            "Can you describe a challenging project they worked on and how they approached it?",
            "How did they collaborate with team members and handle code reviews?",
            "What are their strongest programming languages and technical competencies?",
            "Would you recommend them for a senior software development position?"
        ],
        "marketing": [
            "How would you evaluate their campaign management and strategic thinking?",
            "Can you provide examples of successful marketing initiatives they led?",
            "How did they handle budget management and performance metrics?",
            "What are their strengths in team leadership and client relations?",
            "Would you hire them again for a marketing leadership role?"
        ],
        "management": [
            "How would you assess their leadership and team management skills?",
            "Can you describe how they handled difficult situations or conflicts?",
            "How did they contribute to achieving team and organizational goals?",
            "What are their strengths in communication and decision-making?",
            "Would you recommend them for a senior management position?"
        ],
        "default": [
            "How would you describe the candidate's work performance and professionalism?",
            "What are their key strengths and areas of expertise?",  
            "How did they handle challenges and work under pressure?",
            "Can you provide examples of their contributions to team success?",
            "Would you recommend them for a position in their field of expertise?"
        ]
    }

    if any(tech_term in role_lower for tech_term in ["software", "developer", "engineer", "programmer"]):
        return generic_questions["software"]
    elif any(marketing_term in role_lower for marketing_term in ["marketing", "brand", "campaign", "digital"]):
        return generic_questions["marketing"]
    elif any(mgmt_term in role_lower for mgmt_term in ["manager", "director", "lead", "supervisor"]):
        return generic_questions["management"]
    else:
        return generic_questions["default"]


def _update_application(supabase: Client, **kwargs) -> Dict[str, Any]:
    """Update application with extracted data - IMPROVED VERSION"""
    logger.info(f"Updating application with kwargs: {list(kwargs.keys())}")
    
    try:
        # Extract parameters with validation
        application_id = kwargs.get('application_id')
        if not application_id:
            return {"error": "application_id is required"}
        
        extracted_data = kwargs.get('extracted_data', {})
        role = kwargs.get('role', '')
        organization = kwargs.get('organization', '')
        user_id = kwargs.get('user_id')
        status = kwargs.get('status', 'extracted')
        
        # Prepare update data
        update_data = {
            'extracted_data': extracted_data,
            'status': status,
            'updated_at': 'now()'
        }
        
        # Add optional fields if provided
        if role:
            update_data['role'] = role
        if organization:
            update_data['organization'] = organization
        if user_id:
            update_data['user_id'] = user_id
        
        logger.info(f"Updating application {application_id}")
        response = supabase.table('applications').update(update_data).eq('id', application_id).execute()

        if hasattr(response, 'error') and response.error:
            logger.error(f"Supabase error: {response.error}")
            return {"error": f"Database error: {response.error}"}
            
        logger.info("Application updated successfully")
        return {"success": True, "data": response.data}
        
    except Exception as e:
        logger.error(f"Failed to update application: {str(e)}")
        return {"error": f"Failed to update application: {str(e)}"}


def _create_references(supabase: Client, **kwargs) -> Dict[str, Any]:
    """Create reference records for an application with validation"""
    try:
        application_id = kwargs.get('application_id')
        references = kwargs.get('references', [])
        
        if not application_id:
            return {"error": "application_id is required for creating references"}
        
        if not references or not isinstance(references, list):
            return {"error": "references must be a non-empty list"}
        
        reference_records = []
        for ref in references:
            if not isinstance(ref, dict):
                continue
                
            reference_records.append({
                'application_id': application_id,
                'name': ref.get('name', ''),
                'email': ref.get('email', ''),
                'company': ref.get('company', ''),
                'relationship': ref.get('relationship', ''),
                'years_worked': ref.get('years_worked', ''),
                'status': 'pending'
            })

        if not reference_records:
            return {"error": "No valid reference records to create"}
            
        response = supabase.table('references').insert(reference_records).execute()
        
        if hasattr(response, 'error') and response.error:
            return {"error": f"Database error: {response.error}"}
            
        return {"success": True, "data": response.data, "count": len(reference_records)}
        
    except Exception as e:
        logger.error(f"Failed to create references: {str(e)}")
        return {"error": f"Failed to create references: {str(e)}"}


def _update_status(supabase: Client, **kwargs) -> Dict[str, Any]:
    """Update status of a record with validation"""
    try:
        table = kwargs.get('table')
        record_id = kwargs.get('record_id')
        status = kwargs.get('status')
        
        if not all([table, record_id, status]):
            return {"error": "table, record_id, and status are all required"}
        
        valid_tables = ['applications', 'references', 'questions']
        if table not in valid_tables:
            return {"error": f"Invalid table: {table}. Must be one of {valid_tables}"}
        
        response = supabase.table(table).update({
            'status': status,
            'updated_at': 'now()'
        }).eq('id', record_id).execute()

        if hasattr(response, 'error') and response.error:
            return {"error": f"Database error: {response.error}"}
            
        return {"success": True, "data": response.data}
        
    except Exception as e:
        logger.error(f"Failed to update status: {str(e)}")
        return {"error": f"Failed to update status: {str(e)}"}


# Simple wrapper classes (unchanged)
class QuestionFetcherTool:
    def __init__(self):
        self._fetch_func = create_question_fetcher_tool()
    
    async def get_questions(self, role: str, organization: str) -> List[str]:
        return self._fetch_func(role, organization)


class DatabaseUpdateTool:
    def __init__(self):
        self._update_func = create_database_updater_tool()
    
    def _run(self, action: str, **kwargs) -> Dict[str, Any]:
        return self._update_func(action, **kwargs)