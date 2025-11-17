import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, X, Edit, Send, Users, Mail, Building, Clock, FileText } from 'lucide-react'

interface Application {
  id: string
  role: string
  organization: string
  status: string
  created_at: string
  resume_url: string
  extracted_data: any
}

interface ApplicationDetailsProps {
  application: Application
  onUpdate: () => void
}

export function ApplicationDetails({ application, onUpdate }: ApplicationDetailsProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showApproval, setShowApproval] = useState(false)
  const [editableQuestions, setEditableQuestions] = useState<string[]>([])
  const [sendingEmails, setSendingEmails] = useState(false)

  useEffect(() => {
    if (application.status === 'extracted' || application.status === 'processing') {
      fetchQuestions()
    }
  }, [application])

  const fetchQuestions = async () => {
    try {
      // Get role-specific questions from your database
      const { data, error } = await supabase
        .from('questions')
        .select('question')
        .eq('role_id', 
          supabase.from('roles')
          .select('id')
          .eq('role_name', application.role)
        )
        .eq('active', true)

      if (data && data.length > 0) {
        const questionsList = data.map(q => q.question)
        setQuestions(questionsList)
        setEditableQuestions([...questionsList])
        setShowApproval(true)
      } else {
        // Use default questions if none found
        const defaultQuestions = [
          "How long have you known the candidate and in what capacity?",
          "What were the candidate's main responsibilities while working with you?",
          "What are the candidate's greatest strengths?",
          "Are there any areas where the candidate could improve?",
          "Would you recommend this candidate for employment?"
        ]
        setQuestions(defaultQuestions)
        setEditableQuestions([...defaultQuestions])
        setShowApproval(true)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleSendReferenceRequests = async () => {
    if (!application.extracted_data?.references || application.extracted_data.references.length === 0) {
      alert('No references found to send emails to')
      return
    }

    setSendingEmails(true)
    try {
      // Send reference requests using the correct backend endpoint
      const response = await fetch('http://localhost:8000/api/send-reference-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: application.id,
          questions: editableQuestions,
          references: application.extracted_data.references
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to send reference requests')
      }

      if (result.success) {
        // Update application status in database
        const { error } = await supabase
          .from('applications')
          .update({ 
            status: 'reference_requests_sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id)

        if (error) throw error

        alert(`✅ Successfully sent ${result.total_sent} reference request(s)!`)
        onUpdate()
        setShowApproval(false)
      } else {
        throw new Error('Failed to send reference requests')
      }
    } catch (error: any) {
      console.error('Error sending reference requests:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSendingEmails(false)
    }
  }

  const updateQuestion = (index: number, newQuestion: string) => {
    const updated = [...editableQuestions]
    updated[index] = newQuestion
    setEditableQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setEditableQuestions(editableQuestions.filter((_, i) => i !== index))
  }

  const addQuestion = () => {
    setEditableQuestions([...editableQuestions, 'New question...'])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-6 w-6 text-yellow-500" />
      case 'extracted':
        return <FileText className="h-6 w-6 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'sent':
      case 'reference_requests_sent':
        return <Send className="h-6 w-6 text-indigo-500" />
      case 'completed':
        return <Users className="h-6 w-6 text-purple-500" />
      default:
        return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing'
      case 'extracted':
        return 'References Extracted'
      case 'approved':
        return 'Approved'
      case 'sent':
      case 'reference_requests_sent':
        return 'Reference Requests Sent'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center mb-4">
          {getStatusIcon(application.status)}
          <div className="ml-3">
            <h2 className="text-lg font-bold text-gray-900">{application.role}</h2>
            <p className="text-gray-600">{application.organization}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Created: {new Date(application.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm font-medium text-gray-700">
            Status: {getStatusText(application.status)}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Extracted Data */}
        {application.extracted_data && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Extracted Information</h3>
            
            {application.extracted_data.name && application.extracted_data.name !== 'Unknown' && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Applicant:</span>
                <span className="ml-2 text-sm text-gray-900">{application.extracted_data.name}</span>
              </div>
            )}

            {application.extracted_data.email && application.extracted_data.email !== 'Unknown' && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{application.extracted_data.email}</span>
              </div>
            )}

            {application.extracted_data.phone && application.extracted_data.phone !== 'Unknown' && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-sm text-gray-900">{application.extracted_data.phone}</span>
              </div>
            )}

            {application.extracted_data.references && application.extracted_data.references.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700 mb-2 block">References Found:</span>
                <div className="space-y-3">
                  {application.extracted_data.references.map((ref: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Users className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="font-medium text-gray-900">{ref.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {ref.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {ref.email}
                          </div>
                        )}
                        {ref.phone_number && (
                          <div className="flex items-center">
                            <span className="mr-2">📱</span>
                            {ref.phone_number}
                          </div>
                        )}
                        {(ref.company || ref.relationship) && (
                          <div className="flex items-center">
                            <Building className="h-3 w-3 mr-2" />
                            {ref.company} {ref.relationship && `• ${ref.relationship}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Approval Interface */}
        {showApproval && application.extracted_data?.references?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ready to Send Reference Requests</h3>
              <button
                onClick={addQuestion}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Question
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {editableQuestions.map((question, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none bg-white"
                    rows={2}
                  />
                  <button
                    onClick={() => removeQuestion(index)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSendReferenceRequests}
                disabled={sendingEmails || editableQuestions.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {sendingEmails ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send to {application.extracted_data.references.length} Reference(s)
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-3 text-center">
              📧 Emails will be sent to: {application.extracted_data.references.map((ref: any) => ref.email).join(', ')}
            </p>
          </div>
        )}

        {/* Status Messages */}
        {application.status === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Your resume is being processed. We're extracting reference information.
              </p>
            </div>
          </div>
        )}

        {application.status === 'extracted' && application.extracted_data?.references?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                Found {application.extracted_data.references.length} reference(s). Ready to send reference requests.
              </p>
            </div>
          </div>
        )}

        {application.status === 'extracted' && (!application.extracted_data?.references || application.extracted_data.references.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Resume processed but no references found. You can still proceed with manual reference entry.
              </p>
            </div>
          </div>
        )}

        {(application.status === 'sent' || application.status === 'reference_requests_sent') && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center">
              <Send className="h-5 w-5 text-indigo-600 mr-2" />
              <p className="text-sm text-indigo-800">
                Reference requests have been sent. Waiting for responses.
              </p>
            </div>
          </div>
        )}

        {application.status === 'completed' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <p className="text-sm text-purple-800">
                All references have responded. Your reference check is complete!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}