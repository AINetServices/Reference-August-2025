/*
  # Create storage bucket for resumes

  1. Storage Setup
    - Create 'resumes' bucket for file uploads
    - Set up appropriate policies for authenticated users

  2. Security
    - Allow authenticated users to upload files
    - Allow users to read their own uploaded files
*/

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Policy to allow users to read their own files
CREATE POLICY "Users can read own resume files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own resume files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);