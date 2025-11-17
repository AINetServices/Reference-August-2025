import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ApplicationUpload } from './ApplicationUpload'
import { ApplicationsList } from './ApplicationsList'
import { ApplicationDetails } from './ApplicationDetails'
import { LogOut, Plus, FileText, Users, CheckCircle, Clock } from 'lucide-react'

interface Application {
  id: string
  user_id: string
  resume_url: string
  role_id: string
  organization_id: string
  extracted_data: any
  status: 'processing' | 'extracted' | 'approved' | 'sent' | 'completed'
  created_at: string
  updated_at: string
  roles?: { name: string }
  organizations?: { name: string }
}

interface DashboardStats {
  total: number
  processing: number
  approved: number
  completed: number
  sent: number
  extracted: number
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    processing: 0,
    approved: 0,
    completed: 0,
    sent: 0,
    extracted: 0
  })

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          roles (name),
          organizations (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
      
      // Calculate stats
      if (data) {
        const newStats: DashboardStats = {
          total: data.length,
          processing: data.filter(app => app.status === 'processing').length,
          approved: data.filter(app => app.status === 'approved').length,
          completed: data.filter(app => app.status === 'completed').length,
          sent: data.filter(app => app.status === 'sent').length,
          extracted: data.filter(app => app.status === 'extracted').length
        }
        setStats(newStats)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleNewApplication = () => {
    setShowUpload(true)
    setSelectedApp(null)
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    fetchApplications()
  }

  const handleCancelUpload = () => {
    setShowUpload(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reference Checker</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewApplication}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </button>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Processing</p>
                <p className="text-lg font-bold text-gray-900">{stats.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Sent</p>
                <p className="text-lg font-bold text-gray-900">{stats.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Extracted</p>
                <p className="text-lg font-bold text-gray-900">{stats.extracted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {showUpload ? (
              <ApplicationUpload 
                onComplete={handleUploadComplete}
                onCancel={handleCancelUpload}
              />
            ) : (
              <ApplicationsList
                applications={applications}
                onSelectApplication={setSelectedApp}
                selectedApplication={selectedApp}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedApp && (
              <ApplicationDetails
                application={selectedApp}
                onUpdate={fetchApplications}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}