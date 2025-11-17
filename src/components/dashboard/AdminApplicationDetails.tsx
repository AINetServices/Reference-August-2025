import React, { useEffect, useState } from 'react'
import { ArrowLeft, User, Mail, Phone, Briefcase, Building, Calendar, FileText, Send, CheckCircle, AlertCircle, Clock, Download, RefreshCw } from 'lucide-react'

interface AdminApplicationDetailsProps {
  applicationId: string
  onBack: () => void
}

interface ApplicationData {
  id: string
  applicant_name: string
  applicant_email: string
  role: string
  organization: string
  status: string
  status_display: string
  created_at: string
  user_id: string
  extracted_data?: {
    name?: string
    email?: string
    phone?: string
    references?: any[]
    resume_url?: string
  }
  reference_requests?: any[]
  reference_responses?: any[]
}

export function AdminApplicationDetails({ applicationId, onBack }: AdminApplicationDetailsProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplicationDetails()
  }, [applicationId])

  const fetchApplicationDetails = async () => {
    try {
      setError(null)
      setLoading(true)
      
      const apiUrl = import.meta.env.VITE_API_URL
      // TODO: Create this endpoint in your backend
      // const response = await fetch(`${apiUrl}/api/admin/applications/${applicationId}`)
      // const data = await response.json()
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockApplication: ApplicationData = {
        id: applicationId,
        applicant_name: 'John Doe',
        applicant_email: 'john.doe@example.com',
        role: 'IT Specialist',
        organization: 'Camden',
        status: 'reference_requests_sent',
        status_display: 'References Requested',
        created_at: new Date().toISOString(),
        user_id: 'user-123',
        extracted_data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          resume_url: 'https://example.com/resume.pdf',
          references: [
            {
              name: 'Jane Smith',
              email: 'jane.smith@company.com',
              phone: '+1234567891',
              company: 'Tech Corp',
              relationship: 'Former Manager'
            },
            {
              name: 'Mike Johnson',
              email: 'mike.johnson@company.com', 
              phone: '+1234567892',
              company: 'Innovation Inc',
              relationship: 'Colleague'
            }
          ]
        },
        reference_requests: [
          {
            id: 'ref-1',
            reference_name: 'Jane Smith',
            reference_email: 'jane.smith@company.com',
            status: 'sent',
            sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            questions: [
              "How long have you known the candidate?",
              "What were their main responsibilities?"
            ]
          },
          {
            id: 'ref-2', 
            reference_name: 'Mike Johnson',
            reference_email: 'mike.johnson@company.com',
            status: 'completed',
            sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            questions: [
              "How long have you known the candidate?",
              "What were their main responsibilities?"
            ]
          }
        ],
        reference_responses: [
          {
            id: 'resp-1',
            reference_request_id: 'ref-2',
            reference_name: 'Mike Johnson',
            submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            responses: {
              "How long have you known the candidate?": "3 years",
              "What were their main responsibilities?": "Software development and team leadership"
            }
          }
        ]
      }
      
      setApplication(mockApplication)
    } catch (error) {
      console.error('Error fetching application details:', error)
      setError('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'extracted': 'bg-blue-100 text-blue-800',
      'reference_requests_sent': 'bg-purple-100 text-purple-800',
      'curricated': 'bg-orange-100 text-orange-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const handleSendReminder = (referenceEmail: string) => {
    console.log('Sending reminder to:', referenceEmail)
    // TODO: Implement reminder functionality
    alert(`Reminder sent to ${referenceEmail}`)
  }

  const handleDownloadReport = () => {
    console.log('Downloading report for:', applicationId)
    // TODO: Implement report download
    alert('Report download started')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading application details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">Application not found</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const completedReferences = application.reference_requests?.filter(req => req.status === 'completed').length || 0
  const totalReferences = application.reference_requests?.length || 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
            <p className="text-gray-600 mt-1">Admin View - Application ID: {application.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
            {application.status_display}
          </span>
          <button
            onClick={handleDownloadReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Applicant Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<User className="h-4 w-4" />} label="Full Name" value={application.extracted_data?.name || application.applicant_name} />
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={application.extracted_data?.email || application.applicant_email} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={application.extracted_data?.phone || 'N/A'} />
              <InfoItem icon={<Briefcase className="h-4 w-4" />} label="Applied Role" value={application.role} />
              <InfoItem icon={<Building className="h-4 w-4" />} label="Organization" value={application.organization} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Applied Date" value={formatDate(application.created_at)} />
            </div>
            {application.extracted_data?.resume_url && (
              <div className="mt-4 pt-4 border-t">
                <a 
                  href={application.extracted_data.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </a>
              </div>
            )}
          </div>

          {/* Reference Requests Status */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Send className="h-5 w-5 mr-2 text-purple-600" />
                Reference Requests
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({completedReferences}/{totalReferences} completed)
                </span>
              </div>
              <div className="text-sm font-normal">
                {totalReferences > 0 && (
                  <span className={`px-2 py-1 rounded ${
                    completedReferences === totalReferences ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {completedReferences === totalReferences ? 'All Complete' : 'In Progress'}
                  </span>
                )}
              </div>
            </h2>
            
            {application.reference_requests && application.reference_requests.length > 0 ? (
              <div className="space-y-4">
                {application.reference_requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          request.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.reference_name}</h3>
                          <p className="text-sm text-gray-600">{request.reference_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.status !== 'completed' && (
                          <button
                            onClick={() => handleSendReminder(request.reference_email)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Sent: {formatDate(request.sent_at)}</p>
                      {request.completed_at && (
                        <p>Completed: {formatDate(request.completed_at)}</p>
                      )}
                    </div>

                    {/* Show responses if completed */}
                    {request.status === 'completed' && application.reference_responses && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="font-medium text-gray-900 mb-2">Responses:</h4>
                        {application.reference_responses
                          .filter(resp => resp.reference_request_id === request.id)
                          .map((response, idx) => (
                            <div key={idx} className="space-y-2">
                              {Object.entries(response.responses || {}).map(([question, answer]) => (
                                <div key={question} className="text-sm">
                                  <p className="font-medium text-gray-700">{question}</p>
                                  <p className="text-gray-600 ml-2">{answer as string}</p>
                                </div>
                              ))}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No reference requests sent yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Timeline */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Application Timeline</h3>
            <div className="space-y-3">
              <TimelineItem 
                status="completed" 
                title="Application Submitted" 
                date={application.created_at} 
              />
              <TimelineItem 
                status={['extracted', 'reference_requests_sent', 'completed'].includes(application.status) ? 'completed' : 'pending'} 
                title="Data Extracted" 
                date={application.created_at} 
              />
              <TimelineItem 
                status={['reference_requests_sent', 'completed'].includes(application.status) ? 'completed' : 'pending'} 
                title="References Requested" 
                date={application.reference_requests?.[0]?.sent_at} 
              />
              <TimelineItem 
                status={application.status === 'completed' ? 'completed' : 'pending'} 
                title="References Completed" 
                date={application.reference_requests?.find(req => req.status === 'completed')?.completed_at} 
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Admin Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm flex items-center justify-center">
                <Send className="h-4 w-4 mr-2" />
                Send Reminder to All
              </button>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm flex items-center justify-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </button>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm flex items-center justify-center">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>

          {/* Application Statistics */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Statistics</h3>
            <div className="space-y-3">
              <StatItem label="Total References" value={totalReferences.toString()} />
              <StatItem label="Completed" value={completedReferences.toString()} />
              <StatItem label="Pending" value={(totalReferences - completedReferences).toString()} />
              <StatItem label="Response Rate" value={totalReferences > 0 ? `${Math.round((completedReferences / totalReferences) * 100)}%` : '0%'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InfoItem({ icon, label, value }: { icon?: React.ReactNode, label: string, value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </label>
      <p className="text-gray-900">{value || 'N/A'}</p>
    </div>
  )
}

function TimelineItem({ status, title, date }: { status: 'completed' | 'pending', title: string, date: string | null }) {
  return (
    <div className="flex items-center">
      <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
        status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
      }`} />
      <div className="ml-3">
        <p className={`text-sm font-medium ${
          status === 'completed' ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {title}
        </p>
        {date && (
          <p className="text-xs text-gray-400">
            {new Date(date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}