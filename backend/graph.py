import os
from typing import Dict, Any, List, Optional, TypedDict
from langchain_core.runnables import Runnable
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import time
from dotenv import load_dotenv

from auth import AuthManager
from storage import StorageManager
from db import DatabaseManager
from parser import ResumeParser

load_dotenv()

class WorkflowState(TypedDict):
    user_id: Optional[str]
    application_id: Optional[str]
    resume_path: Optional[str]
    parsed: Optional[Dict[str, Any]]
    questions: Optional[List[Dict[str, Any]]]
    approval_status: Optional[str]
    error: Optional[str]
    role_id: Optional[str]
    organization_id: Optional[str]

class ReferenceWorkflow:
    def __init__(self):
        self.auth_manager = AuthManager()
        self.storage_manager = StorageManager()
        self.db_manager = DatabaseManager()
        self.parser = ResumeParser()
        self.graph = self._create_graph()
    
    def _create_graph(self) -> StateGraph:
        """Create and configure the LangGraph workflow"""
        graph = StateGraph(WorkflowState)
        
        # Add nodes
        graph.add_node("auth_node", self.auth_node)
        graph.add_node("upload_node", self.upload_node)
        graph.add_node("parse_resume_node", self.parse_resume_node)
        graph.add_node("fetch_questions_node", self.fetch_questions_node)
        graph.add_node("queue_review_node", self.queue_review_node)
        graph.add_node("gate_approval_node", self.gate_approval_node)
        graph.add_node("send_reference_requests_node", self.send_reference_requests_node)
        
        # Define edges
        graph.add_edge("auth_node", "upload_node")
        graph.add_edge("upload_node", "parse_resume_node")
        graph.add_edge("parse_resume_node", "fetch_questions_node")
        graph.add_edge("fetch_questions_node", "queue_review_node")
        graph.add_edge("queue_review_node", "gate_approval_node")
        graph.add_edge("gate_approval_node", "send_reference_requests_node")
        graph.add_edge("send_reference_requests_node", END)
        
        # Set entry point
        graph.set_entry_point("auth_node")
        
        # Compile graph
        memory = MemorySaver()
        return graph.compile(checkpointer=memory)
    
    def auth_node(self, state: WorkflowState) -> WorkflowState:
        """Authenticate user and verify session"""
        print("🔐 Executing auth_node...")
        
        try:
            current_user = self.auth_manager.get_current_user()
            if not current_user:
                state["error"] = "User not authenticated"
                print("❌ Authentication failed: No current user")
                return state
            
            state["user_id"] = current_user.get("id")
            print(f"✅ Authentication successful for user: {state['user_id']}")
            
            return state
            
        except Exception as e:
            state["error"] = f"Authentication error: {str(e)}"
            print(f"❌ Authentication error: {e}")
            return state
    
    def upload_node(self, state: WorkflowState) -> WorkflowState:
        """Upload resume file and create application record"""
        print("📄 Executing upload_node...")
        
        try:
            if not state.get("user_id"):
                state["error"] = "No authenticated user"
                return state
            
            # This would typically receive file_path, role_id, organization_id from input
            # For demo purposes, using placeholder values
            file_path = state.get("file_path", "/tmp/sample_resume.pdf")
            role_id = state.get("role_id", "sample-role-id")
            organization_id = state.get("organization_id", "sample-org-id")
            
            if not os.path.exists(file_path):
                state["error"] = f"Resume file not found: {file_path}"
                return state
            
            # Upload file to Supabase Storage
            upload_result = self.storage_manager.upload_resume(file_path, state["user_id"])
            
            if not upload_result.get("success"):
                state["error"] = f"File upload failed: {upload_result.get('error')}"
                return state
            
            state["resume_path"] = upload_result["path"]
            
            # Create application record
            app_result = self.db_manager.create_application(
                applicant_id=state["user_id"],
                role_id=role_id,
                organization_id=organization_id,
                resume_file_path=state["resume_path"]
            )
            
            if not app_result.get("success"):
                state["error"] = f"Application creation failed: {app_result.get('error')}"
                return state
            
            state["application_id"] = app_result["data"]["id"]
            state["role_id"] = role_id
            state["organization_id"] = organization_id
            
            print(f"✅ File uploaded and application created: {state['application_id']}")
            return state
            
        except Exception as e:
            state["error"] = f"Upload error: {str(e)}"
            print(f"❌ Upload error: {e}")
            return state
    
    def parse_resume_node(self, state: WorkflowState) -> WorkflowState:
        """Parse resume using Groq LLM and save references"""
        print("🤖 Executing parse_resume_node...")
        
        try:
            if not state.get("resume_path"):
                state["error"] = "No resume path available"
                return state
            
            # Download file content from Supabase Storage
            file_content = self.storage_manager.download_resume(state["resume_path"])
            
            if not file_content:
                state["error"] = "Could not download resume file"
                return state
            
            # Parse resume with Groq
            parse_result = self.parser.parse_resume_from_file(file_content, state["resume_path"])
            
            if not parse_result.get("success"):
                state["error"] = f"Resume parsing failed: {parse_result.get('error')}"
                return state
            
            parsed_data = parse_result["data"]
            state["parsed"] = parsed_data
            
            # Save candidate references to database
            if parsed_data.get("references"):
                save_result = self.db_manager.save_candidate_references(
                    application_id=state["application_id"],
                    references=parsed_data["references"]
                )
                
                if not save_result.get("success"):
                    print(f"⚠️ Warning: Failed to save references: {save_result.get('error')}")
            
            print(f"✅ Resume parsed successfully. Found {len(parsed_data.get('references', []))} references")
            return state
            
        except Exception as e:
            state["error"] = f"Parse error: {str(e)}"
            print(f"❌ Parse error: {e}")
            return state
    
    def fetch_questions_node(self, state: WorkflowState) -> WorkflowState:
        """Fetch predefined questions from database"""
        print("❓ Executing fetch_questions_node...")
        
        try:
            if not state.get("role_id") or not state.get("organization_id"):
                state["error"] = "Missing role_id or organization_id"
                return state
            
            # Fetch questions from database
            questions = self.db_manager.get_questions(
                role_id=state["role_id"],
                organization_id=state["organization_id"]
            )
            
            state["questions"] = questions
            print(f"✅ Fetched {len(questions)} questions")
            return state
            
        except Exception as e:
            state["error"] = f"Fetch questions error: {str(e)}"
            print(f"❌ Fetch questions error: {e}")
            return state
    
    def queue_review_node(self, state: WorkflowState) -> WorkflowState:
        """Queue questions for human review"""
        print("📋 Executing queue_review_node...")
        
        try:
            if not state.get("application_id") or not state.get("questions"):
                state["error"] = "Missing application_id or questions"
                return state
            
            # Create question review record
            review_result = self.db_manager.create_question_review(
                application_id=state["application_id"],
                questions=state["questions"]
            )
            
            if not review_result.get("success"):
                state["error"] = f"Failed to create question review: {review_result.get('error')}"
                return state
            
            state["approval_status"] = "pending"
            print(f"✅ Questions queued for review with status: pending")
            return state
            
        except Exception as e:
            state["error"] = f"Queue review error: {str(e)}"
            print(f"❌ Queue review error: {e}")
            return state
    
    def gate_approval_node(self, state: WorkflowState) -> WorkflowState:
        """Wait for human approval before proceeding"""
        print("⏳ Executing gate_approval_node...")
        
        try:
            if not state.get("application_id"):
                state["error"] = "Missing application_id"
                return state
            
            # Check current approval status
            review = self.db_manager.get_question_review(state["application_id"])
            
            if not review:
                state["error"] = "Question review not found"
                return state
            
            state["approval_status"] = review.get("status", "pending")
            
            if state["approval_status"] != "approved":
                print(f"🛑 Workflow paused - waiting for approval. Current status: {state['approval_status']}")
                print("💡 Use the admin script to approve the review: python main.py approve <application_id>")
                # In a real implementation, this would pause and wait
                # For demo purposes, we'll just stop here
                state["error"] = "Waiting for manual approval"
                return state
            
            print("✅ Approval received - proceeding with workflow")
            return state
            
        except Exception as e:
            state["error"] = f"Gate approval error: {str(e)}"
            print(f"❌ Gate approval error: {e}")
            return state
    
    def send_reference_requests_node(self, state: WorkflowState) -> WorkflowState:
        """Send reference requests to referees (stubbed email sending)"""
        print("📧 Executing send_reference_requests_node...")
        
        try:
            if not state.get("application_id") or not state.get("questions"):
                state["error"] = "Missing application_id or questions"
                return state
            
            # Create reference request records
            request_result = self.db_manager.create_reference_requests(
                application_id=state["application_id"],
                questions=state["questions"]
            )
            
            if not request_result.get("success"):
                state["error"] = f"Failed to create reference requests: {request_result.get('error')}"
                return state
            
            # Stub email sending (just log)
            references = self.db_manager.get_candidate_references(state["application_id"])
            for ref in references:
                print(f"📧 [STUB] Sending reference request email to: {ref.get('name')} ({ref.get('email')})")
                print(f"   Company: {ref.get('company')}")
                print(f"   Context: {ref.get('worked_together')}")
            
            # Update application status
            self.db_manager.update_application_status(state["application_id"], "references_sent")
            
            print(f"✅ Reference requests sent to {len(references)} referees")
            return state
            
        except Exception as e:
            state["error"] = f"Send reference requests error: {str(e)}"
            print(f"❌ Send reference requests error: {e}")
            return state
    
    def run_workflow(self, inputs: Dict[str, Any], thread_id: str = "default") -> Dict[str, Any]:
        """Run the complete workflow"""
        try:
            print("🚀 Starting reference application workflow...")
            
            config = {"configurable": {"thread_id": thread_id}}
            result = self.graph.invoke(inputs, config=config)
            
            if result.get("error"):
                print(f"❌ Workflow failed: {result['error']}")
            else:
                print("✅ Workflow completed successfully!")
            
            return result
            
        except Exception as e:
            print(f"❌ Workflow execution error: {e}")
            return {"error": str(e)}