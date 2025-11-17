import React, { useState, useRef } from 'react'
import { Upload, FileText, X, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface ApplicationUploadProps {
  onComplete: () => void
}

export function ApplicationUpload({ onComplete }: ApplicationUploadProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [roleName, setRoleName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ role: '', org: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type.includes('document'))) {
      setFile(droppedFile)
      setError('')
    } else {
      setError('Please upload a PDF or document file')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const validateForm = () => {
    const errors = { role: '', org: '' }
    let isValid = true

    if (!roleName.trim()) {
      errors.role = 'Role/Position is required'
      isValid = false
    }

    if (!orgName.trim()) {
      errors.org = 'Organization is required'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }
    
    if (!file || !user) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log('📤 Uploading file to Supabase storage...')
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      console.log('✅ File uploaded, URL:', urlData.publicUrl)

      // Step 3: Create application in database - MODIFIED
      console.log('📝 Creating application in database...')
      const { data, error: dbError } = await supabase.rpc('create_application_with_org', {
        p_user_id: user.id,
        p_resume_url: urlData.publicUrl,
        p_role_name: roleName.trim(),
        p_org_name: orgName.trim(),
        p_status: 'processing'
      })

      if (dbError) {
        throw dbError
      }

      console.log('✅ Application created with ID:', data.application_id)

      // Step 4: Send to FastAPI backend for processing - MODIFIED
      const requestBody = {
        resume_url: urlData.publicUrl,
        role: roleName.trim(),        // This should be role_id but you're sending name
        organization: orgName.trim(), // This should be organization_id but you're sending name
        user_id: user.id,
        application_id: data.application_id,
        references: []
      }

      console.log('🔄 Sending to backend for processing...')
      const processResponse = await fetch('http://localhost:8000/api/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!processResponse.ok) {
        let errorText = await processResponse.text()
        let errorData = errorText
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Keep as text if not JSON
        }
        throw new Error(`Backend processing failed: ${JSON.stringify(errorData)}`)
      }

      const processData = await processResponse.json()
      console.log('✅ Backend processing successful:', processData)
      
      // ADDED: Force refresh with delay to ensure database is updated
      console.log('🔄 Waiting for database to update...')
      setTimeout(() => {
        console.log('✅ Refreshing dashboard...')
        onComplete()
      }, 2000) // 2 second delay to ensure backend completes

    } catch (err: any) {
      console.error('❌ Upload error:', err)
      setError(err.message || 'Failed to upload application')
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">New Application</h2>
        <p className="text-gray-600">Upload your resume and specify the role details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Resume Upload
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">PDF, DOC, DOCX up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Role and Organization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role/Position *
            </label>
            <input
              type="text"
              id="role"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value)
                if (fieldErrors.role && e.target.value.trim()) {
                  setFieldErrors({ ...fieldErrors, role: '' })
                }
              }}
              className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                fieldErrors.role ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Software Engineer, Marketing Manager"
              required
            />
            {fieldErrors.role && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.role}</p>
            )}
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
              Organization *
            </label>
            <input
              type="text"
              id="organization"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value)
                if (fieldErrors.org && e.target.value.trim()) {
                  setFieldErrors({ ...fieldErrors, org: '' })
                }
              }}
              className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                fieldErrors.org ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Tech Corp, Digital Agency"
              required
            />
            {fieldErrors.org && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.org}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || !roleName.trim() || !orgName.trim() || loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}