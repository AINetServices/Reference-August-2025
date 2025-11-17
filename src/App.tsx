import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { Dashboard } from './components/dashboard/Dashboard'
import { AdminDashboard } from './components/dashboard/AdminDashboard' // Add this import back

type AuthMode = 'signin' | 'signup' | 'forgot'

function App() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('signin')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthForm 
        mode={authMode} 
        onModeChange={setAuthMode}
      />
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App