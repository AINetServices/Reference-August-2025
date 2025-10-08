import os
from typing import Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()

class StorageManager:
    def __init__(self):
        url: str = os.environ.get("VITE_SUPABASE_URL")
        key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("Missing Supabase URL or API key in environment variables")
        self.supabase: Client = create_client(url, key)
        self.bucket_name = "resumes"
    
    def upload_resume(self, file_path: str, user_id: str) -> Dict[str, Any]:
        """Upload resume file to Supabase Storage"""
        try:
            # Generate unique file name
            file_extension = os.path.splitext(file_path)[1]
            unique_filename = f"{user_id}/{uuid.uuid4()}{file_extension}"
            
            # Read file content
            with open(file_path, 'rb') as file:
                file_content = file.read()
            
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": self._get_content_type(file_extension)}
            )
            
            if response:
                storage_path = f"{self.bucket_name}/{unique_filename}"
                return {
                    "success": True,
                    "path": storage_path,
                    "public_url": self.get_public_url(unique_filename),
                    "message": "File uploaded successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Upload failed",
                    "message": "Failed to upload file"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to upload resume"
            }
    
    def download_resume(self, file_path: str) -> Optional[bytes]:
        """Download resume file from Supabase Storage"""
        try:
            # Remove bucket name from path if present
            if file_path.startswith(f"{self.bucket_name}/"):
                file_path = file_path[len(f"{self.bucket_name}/"):]
            
            response = self.supabase.storage.from_(self.bucket_name).download(file_path)
            return response
        except Exception as e:
            print(f"Error downloading file: {e}")
            return None
    
    def get_public_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            return response.get('publicUrl', '') if response else ''
        except Exception as e:
            print(f"Error getting public URL: {e}")
            return ''
    
    def delete_file(self, file_path: str) -> Dict[str, Any]:
        """Delete file from storage"""
        try:
            # Remove bucket name from path if present
            if file_path.startswith(f"{self.bucket_name}/"):
                file_path = file_path[len(f"{self.bucket_name}/"):]
            
            response = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            
            if response:
                return {
                    "success": True,
                    "message": "File deleted successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete file"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to delete file"
            }
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')