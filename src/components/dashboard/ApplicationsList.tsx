import React from 'react'
import { FileText, Clock, CheckCircle, Send, Users, Calendar } from 'lucide-react'

interface Application {
  id: string
  role: string
  organization: string
  status: string
  created_at: string
  resume_url: string
  extracted_data: any
}

interface ApplicationsListProps {
  applications: Application[]
  onSelectApplication: (app: Application) => void
  selectedApplication: Application | null
}

export function ApplicationsList({ applications, onSelectApplication, selectedApplication }: ApplicationsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'extracted':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'sent':
        return <Send className="h-5 w-5 text-indigo-500" />
      case 'completed':
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'extracted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'sent':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-600 mb-6">
          Start by uploading your resume and creating your first application
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Your Applications</h2>
        <p className="text-gray-600">Manage and track your reference check requests</p>
      </div>

      <div className="divide-y divide-gray-200">
        {applications.map((app) => (
          <div
            key={app.id}
            className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedApplication?.id === app.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
            }`}
            onClick={() => onSelectApplication(app)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getStatusIcon(app.status)}
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">
                    {app.role}
                  </h3>
                </div>
                <p className="text-gray-600 mb-3">{app.organization}</p>
                
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                    {formatStatus(app.status)}
                  </span>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(app.created_at)}
                  </div>
                </div>

                {app.extracted_data && app.extracted_data.references && (
                  <div className="mt-3 text-sm text-gray-600">
                    <Users className="h-4 w-4 inline mr-1" />
                    {app.extracted_data.references.length} references found
                  </div>
                )}
              </div>

              <div className="ml-6">
                <div className="text-right">
                  <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}