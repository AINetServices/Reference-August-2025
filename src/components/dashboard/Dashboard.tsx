import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ApplicationUpload } from './ApplicationUpload'
import { ApplicationsList } from './ApplicationsList'
import { ApplicationDetails } from './ApplicationDetails'
import { LogOut, Plus, FileText, Users, CheckCircle, Clock, Activity } from 'lucide-react'

interface Application {
  id: string
  role: string
  organization: string
  status: string
  created_at: string
  resume_url: string
  extracted_data: any
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    approved: 0,
    completed: 0
  })

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      console.log("🔄 Fetching applications from Supabase...")
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} applications`)
      
      setApplications(data || [])
      
      const newStats = (data || []).reduce((acc, app) => {
        acc.total++
        const status = app.status || 'processing'
        acc[status as keyof typeof acc] = (acc[status as keyof typeof acc] || 0) + 1
        return acc
      }, { 
        total: 0, 
        processing: 0, 
        approved: 0, 
        completed: 0,
        sent: 0,
        extracted: 0
      } as any)
      
      console.log("📊 Stats calculated:", newStats)
      setStats({
        total: newStats.total,
        processing: newStats.processing,
        approved: newStats.approved,
        completed: newStats.completed
      })
      
    } catch (error) {
      console.error('❌ Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNewApplication = () => {
    setShowUpload(true)
    setSelectedApp(null)
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    setTimeout(() => {
      fetchApplications()
    }, 1000)
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
              {/* Admin Button - Added at the top */}
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition-all duration-200 flex items-center"
              >
                <Activity className="h-4 w-4 mr-2" />
                Admin Dashboard
              </button>
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
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {showUpload ? (
              <ApplicationUpload onComplete={handleUploadComplete} />
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