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

  useEffect(() => {
    if (application.status === 'extracted') {
      fetchQuestions()
    }
  }, [application])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('questions')
        .eq('role', application.role)
        .eq('organization', application.organization)
        .single()

      if (data) {
        const questionsList = Array.isArray(data.questions) ? data.questions : []
        setQuestions(questionsList)
        setEditableQuestions([...questionsList])
        setShowApproval(true)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleApproveQuestions = async () => {
    setLoading(true)
    try {
      // Update application status to approved
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'approved',
          extracted_data: {
            ...application.extracted_data,
            approved_questions: editableQuestions
          }
        })
        .eq('id', application.id)

      if (error) throw error

      // Send questions to references (this would call your backend)
      await fetch('/api/send-questions', {
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

      onUpdate()
      setShowApproval(false)
    } catch (error) {
      console.error('Error approving questions:', error)
    } finally {
      setLoading(false)
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
        return <Send className="h-6 w-6 text-indigo-500" />
      case 'completed':
        return <Users className="h-6 w-6 text-purple-500" />
      default:
        return <FileText className="h-6 w-6 text-gray-500" />
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
        
        <div className="text-sm text-gray-500">
          Created: {new Date(application.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Extracted Data */}
        {application.extracted_data && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Extracted Information</h3>
            
            {application.extracted_data.applicant_name && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Applicant:</span>
                <span className="ml-2 text-sm text-gray-900">{application.extracted_data.applicant_name}</span>
              </div>
            )}

            {application.extracted_data.references && application.extracted_data.references.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700 mb-2 block">References:</span>
                <div className="space-y-2">
                  {application.extracted_data.references.map((ref: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <Users className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="font-medium text-gray-900">{ref.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {ref.email}
                        </div>
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-2" />
                          {ref.company} • {ref.relationship}
                        </div>
                        <div>Years worked together: {ref.years_worked}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Approval Interface */}
        {showApproval && questions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Review & Approve Questions</h3>
              <button
                onClick={addQuestion}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Question
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {editableQuestions.map((question, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
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
                onClick={handleApproveQuestions}
                disabled={loading || editableQuestions.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve & Send Questions
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {application.status === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Your resume is being processed. We're extracting reference information and matching questions.
              </p>
            </div>
          </div>
        )}

        {application.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">
                Questions have been approved and sent to your references.
              </p>
            </div>
          </div>
        )}

        {application.status === 'sent' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center">
              <Send className="h-5 w-5 text-indigo-600 mr-2" />
              <p className="text-sm text-indigo-800">
                Reference questions have been sent. Waiting for responses.
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