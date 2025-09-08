import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, Clock, Send, User, Building, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface PendingRequest {
  id: string;
  status: string;
  created_at: string;
  candidates: {
    name: string;
    roles: {
      title: string;
      organizations: {
        name: string;
      };
    };
  };
  references: {
    name: string;
    email: string;
    company: string | null;
  };
  questions: any[];
}

export function AdminDashboard() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('reference_requests')
        .select(`
          *,
          candidates (
            name,
            roles (
              title,
              organizations (
                name
              )
            )
          ),
          references (
            name,
            email,
            company
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('reference_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the list
      fetchPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleSend = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('reference_requests')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Here you would integrate with your email service
      // For now, we'll just update the status
      
      fetchPendingRequests();
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Dashboard</h2>
      
      {pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {request.candidates.name}
                    </span>
                    <span className="text-gray-500">applying for</span>
                    <span className="font-medium text-blue-600">
                      {request.candidates.roles.title}
                    </span>
                    <span className="text-gray-500">at</span>
                    <span className="font-medium text-gray-900">
                      {request.candidates.roles.organizations.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>Reference: {request.references.name} ({request.references.email})</span>
                  </div>
                  
                  {request.references.company && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>Previously worked at: {request.references.company}</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Submitted {format(new Date(request.created_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    </>
                  )}
                  
                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleSend(request.id)}
                      className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Reference</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Questions to be sent:</h4>
                <div className="space-y-2">
                  {(request.questions || []).map((question: any, index: number) => (
                    <div key={question.id || index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 text-sm">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}