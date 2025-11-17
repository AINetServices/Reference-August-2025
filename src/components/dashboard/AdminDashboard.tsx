import React, { useEffect, useState } from 'react'
import { BarChart, Activity, Users, FileText, Send, CheckCircle, RefreshCw, ArrowLeft, User, Mail, Calendar, Clock, AlertCircle, X } from 'lucide-react'

export function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setError(null)
      setLoading(true)
      
      // Check if API URL is set
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        throw new Error('API URL is not configured. Please check your environment variables.')
      }
      
      const url = `${apiUrl}/api/admin/overview`
      console.log('🔄 Fetching admin overview from:', url)
      
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('✅ Admin overview data:', data)
      
      if (data.success) {
        setOverview(data.overview)
      } else {
        throw new Error(data.detail || 'Failed to load overview data')
      }
    } catch (error) {
      console.error('❌ Error loading admin overview:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Provide more helpful error messages
      if (errorMessage.includes('undefined/api/admin/overview')) {
        setError('API URL is not configured. Please set VITE_API_URL in your environment variables.')
      } else if (errorMessage.includes('Failed to fetch')) {
        setError('Cannot connect to backend server. Make sure your Python backend is running on port 8000.')
      } else if (errorMessage.includes('HTTP error! status: 500')) {
        setError('Backend server error. The admin endpoint is having issues. Check your backend logs.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchOverview()
  }

  const handleBack = () => {
    window.history.back()
  }

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedApplication(null)
  }

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Format date with time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'extracted': 'bg-blue-100 text-blue-800',
      'reference_requests_sent': 'bg-purple-100 text-purple-800',
      'curricated': 'bg-orange-100 text-orange-800',
      'under review': 'bg-orange-100 text-orange-800',
      'references requested': 'bg-purple-100 text-purple-800',
      'data extracted': 'bg-blue-100 text-blue-800'
    }
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
              <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
                <li>Make sure your Python backend is running on port 8000</li>
                <li>Check that VITE_API_URL is set in your .env file</li>
                <li>Verify the backend endpoint /api/admin/overview exists</li>
                <li>Restart both frontend and backend servers</li>
                <li>Check backend console for detailed error messages</li>
              </ul>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRefresh}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">No data available</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Monitor system performance and application status</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card 
          icon={<FileText className="h-6 w-6" />} 
          label="Total Applications" 
          value={overview.applications_total} 
          color="blue" 
        />
        <Card 
          icon={<Send className="h-6 w-6" />} 
          label="Reference Requests" 
          value={overview.reference_requests_total} 
          color="purple" 
        />
        <Card 
          icon={<CheckCircle className="h-6 w-6" />} 
          label="Responses Completed" 
          value={overview.reference_responses_total} 
          color="green" 
        />
        <Card 
          icon={<Clock className="h-6 w-6" />} 
          label="Completion Rate" 
          value={overview.reference_completion_rate} 
          color="orange" 
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card 
          icon={<Activity className="h-6 w-6" />} 
          label="Response Rate" 
          value={`${overview.metrics?.response_rate || 0}%`} 
          color="blue" 
        />
        <Card 
          icon={<AlertCircle className="h-6 w-6" />} 
          label="Pending References" 
          value={overview.pending_references || 0} 
          color="yellow" 
        />
        <Card 
          icon={<Users className="h-6 w-6" />} 
          label="Recent Activity (7 days)" 
          value={overview.metrics?.recent_activity || 0} 
          color="green" 
        />
      </div>

      {/* Application Status Breakdown */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-blue-600" />
          Application Status Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.application_status_breakdown && Object.entries(overview.application_status_breakdown).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <span className="font-medium text-gray-700 capitalize">{status.toLowerCase()}</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-800 border">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Applications Table */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Recent Applications
          </h2>
          <span className="text-sm text-gray-500">
            Showing {overview.latest_applications?.length || 0} applications
          </span>
        </div>
        
        {overview.latest_applications && overview.latest_applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 font-semibold text-gray-700">Applicant</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Organization</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overview.latest_applications.map((app: any) => (
                  <tr key={app.full_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {app.applicant_name || 'Unknown Applicant'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            ID: {app.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{app.applicant_email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-700">{app.role || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{app.organization || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status_display || app.status)}`}>
                        {app.status_display || app.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(app.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleViewApplication(app)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No applications found</p>
            <p className="text-gray-400 text-sm mt-2">Applications will appear here once submitted</p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Full Name" value={selectedApplication.applicant_name || 'N/A'} />
                  <InfoField label="Email" value={selectedApplication.applicant_email || 'N/A'} />
                  <InfoField label="Role" value={selectedApplication.role || 'N/A'} />
                  <InfoField label="Organization" value={selectedApplication.organization || 'N/A'} />
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Application ID" value={selectedApplication.id || 'N/A'} />
                  <InfoField label="Full ID" value={selectedApplication.full_id || 'N/A'} />
                  <InfoField 
                    label="Status" 
                    value={selectedApplication.status_display || selectedApplication.status || 'N/A'}
                    badgeClass={getStatusColor(selectedApplication.status_display || selectedApplication.status)}
                  />
                  <InfoField label="Created" value={formatDateTime(selectedApplication.created_at)} />
                  {selectedApplication.updated_at && (
                    <InfoField label="Last Updated" value={formatDateTime(selectedApplication.updated_at)} />
                  )}
                </div>
              </div>

              {/* Reference Information */}
              {(selectedApplication.reference_requests || selectedApplication.references) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reference Information</h3>
                  <div className="space-y-3">
                    {selectedApplication.reference_requests && selectedApplication.reference_requests.map((ref: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">Reference {index + 1}:</span> {ref.name || 'N/A'}</div>
                          <div><span className="font-medium">Email:</span> {ref.email || 'N/A'}</div>
                          <div><span className="font-medium">Status:</span> {ref.status || 'Pending'}</div>
                          {ref.submitted_at && (
                            <div><span className="font-medium">Submitted:</span> {formatDateTime(ref.submitted_at)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Data */}
              {selectedApplication.additional_data && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedApplication.additional_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log('Edit application:', selectedApplication.full_id)
                  // Add edit functionality here
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Card component
function Card({ icon, label, value, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  const colorClass = colorClasses[color] || 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// InfoField component for modal
function InfoField({ label, value, badgeClass }: { label: string; value: string; badgeClass?: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1">
        {badgeClass ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {value}
          </span>
        ) : (
          <span className="text-sm text-gray-900">{value}</span>
        )}
      </dd>
    </div>
  )
}