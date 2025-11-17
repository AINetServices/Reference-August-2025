import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ResumeUploadProps {
  onUploadSuccess: (resumeUrl: string, extractedData: any) => void;
}

export function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      setError('Please upload a PDF or Word document');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Mock resume processing (replace with actual parsing when edge function is deployed)
      setProcessing(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data (would be replaced with actual Groq API processing)
      const extractedData = {
        name: "John Doe", // Would be extracted from resume
        references: [
          {
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            company: "TechCorp Inc.",
            work_year: "2022-2023",
            relationship: "Direct Manager"
          },
          {
            name: "Mike Chen", 
            email: "mike.chen@startup.com",
            company: "StartupXYZ",
            work_year: "2021-2022",
            relationship: "Team Lead"
          }
        ]
      };

      onUploadSuccess(publicUrl, extractedData);
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Resume</h2>
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading || processing ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        {uploading || processing ? (
          <div className="space-y-4">
            <Loader className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <div>
              <p className="text-gray-700 font-medium">
                {uploading ? 'Uploading resume...' : 'Processing with AI...'}
              </p>
              <p className="text-gray-500 text-sm">
                {processing ? 'Extracting candidate details and references' : 'Please wait'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-700 font-medium">
                Drop your resume here, or click to browse
              </p>
              <p className="text-gray-500 text-sm">
                Supports PDF and Word documents up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}