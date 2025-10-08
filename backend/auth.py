import os
from typing import Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class AuthManager:
    def __init__(self):
        url: str = os.environ.get("VITE_SUPABASE_URL")
        key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("Missing Supabase URL or API key in environment variables")
        self.supabase: Client = create_client(url, key)
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in user with email and password"""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return {
                "success": True,
                "user": response.user,
                "session": response.session,
                "message": "Successfully signed in"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to sign in"
            }
    
    def sign_up(self, email: str, password: str, full_name: str = None) -> Dict[str, Any]:
        """Sign up new user"""
        try:
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            # Create profile if user was created successfully
            if response.user and full_name:
                self.supabase.table("profiles").insert({
                    "user_id": response.user.id,
                    "email": email,
                    "full_name": full_name
                }).execute()
            
            return {
                "success": True,
                "user": response.user,
                "session": response.session,
                "message": "Successfully signed up"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to sign up"
            }
    
    def sign_out(self) -> Dict[str, Any]:
        """Sign out current user"""
        try:
            self.supabase.auth.sign_out()
            return {
                "success": True,
                "message": "Successfully signed out"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to sign out"
            }
    
    def forgot_password(self, email: str) -> Dict[str, Any]:
        """Send password reset email"""
        try:
            self.supabase.auth.reset_password_email(email)
            return {
                "success": True,
                "message": "Password reset email sent"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send password reset email"
            }
    
    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get current authenticated user"""
        try:
            response = self.supabase.auth.get_user()
            return response.user if response else None
        except Exception:
            return None
    
    def get_session(self) -> Optional[Dict[str, Any]]:
        """Get current session"""
        try:
            response = self.supabase.auth.get_session()
            return response if response else None
        except Exception:
            return None