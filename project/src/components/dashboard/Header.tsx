import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, FileCheck } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileCheck className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Reference Check System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          
          <button
            onClick={signOut}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}