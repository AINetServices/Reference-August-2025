import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ResumeUpload } from './ResumeUpload';
import { RoleSelection } from './RoleSelection';
import { CandidateProfile } from './CandidateProfile';
import { QuestionReview } from './QuestionReview';
import { AdminDashboard } from './AdminDashboard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, Users, FileText } from 'lucide-react';

type Tab = 'application' | 'admin';

interface Reference {
  id: string;
  name: string;
  email: string;
  company: string | null;
  work_year: string | null;
  relationship: string | null;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('application');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [candidateData, setCandidateData] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<string>('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  const handleUploadSuccess = async (resumeUrl: string, extractedData: any) => {
    setCandidateData(extractedData);
    
    // Save candidate to database
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert({
          user_id: user?.id,
          name: extractedData.name,
          resume_url: resumeUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCandidateId(data.id);
      
      // Save references
      if (extractedData.references && extractedData.references.length > 0) {
        const { data: referencesData, error: refError } = await supabase
          .from('references')
          .insert(
            extractedData.references.map((ref: any) => ({
              candidate_id: data.id,
              name: ref.name,
              email: ref.email,
              company: ref.company,
              work_year: ref.work_year,
              relationship: ref.relationship
            }))
          )
          .select();

        if (refError) throw refError;
        setReferences(referencesData || []);
      }
      
      setStep(2);
    } catch (error) {
      console.error('Error saving candidate data:', error);
    }
  };

  const handleRoleSelected = async () => {
    if (selectedOrganization && selectedRole && candidateId) {
      try {
        const { error } = await supabase
          .from('candidates')
          .update({
            organization_id: selectedOrganization,
            role_id: selectedRole
          })
          .eq('id', candidateId);

        if (error) throw error;
        setStep(3);
      } catch (error) {
        console.error('Error updating candidate:', error);
      }
    }
  };

  const handleQuestionsApproved = () => {
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('application')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'application'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span>New Application</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Users className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          </nav>
        </div>

        {activeTab === 'application' && (
          <div className="space-y-8">
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResumeUpload onUploadSuccess={handleUploadSuccess} />
                <RoleSelection
                  selectedOrganization={selectedOrganization}
                  selectedRole={selectedRole}
                  onOrganizationChange={setSelectedOrganization}
                  onRoleChange={setSelectedRole}
                />
              </div>
            )}

            {step === 2 && candidateData && (
              <div className="space-y-6">
                <CandidateProfile
                  name={candidateData.name}
                  email={user?.email || ''}
                  references={references}
                />
                
                <RoleSelection
                  selectedOrganization={selectedOrganization}
                  selectedRole={selectedRole}
                  onOrganizationChange={setSelectedOrganization}
                  onRoleChange={setSelectedRole}
                />
                
                {selectedOrganization && selectedRole && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleRoleSelected}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue to Question Review
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && references.length > 0 && (
              <div className="space-y-6">
                {references.map((reference) => (
                  <QuestionReview
                    key={reference.id}
                    roleId={selectedRole}
                    organizationId={selectedOrganization}
                    candidateId={candidateId}
                    referenceId={reference.id}
                    onApprove={handleQuestionsApproved}
                  />
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  Your reference check requests have been submitted for approval. 
                  You'll be notified once they're sent to your references.
                </p>
                <button
                  onClick={() => {
                    setStep(1);
                    setCandidateData(null);
                    setReferences([]);
                    setSelectedOrganization('');
                    setSelectedRole('');
                    setCandidateId('');
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Another Application
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </div>
    </div>
  );
}