import React from 'react';
import { User, Mail, Building, Calendar } from 'lucide-react';

interface Reference {
  id: string;
  name: string;
  email: string;
  company: string | null;
  work_year: string | null;
  relationship: string | null;
}

interface CandidateProfileProps {
  name: string;
  email: string;
  references: Reference[];
}

export function CandidateProfile({ name, email, references }: CandidateProfileProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Candidate Profile</h2>
      
      <div className="space-y-6">
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-gray-600 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {email}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
          <div className="space-y-3">
            {references.map((reference) => (
              <div key={reference.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">{reference.name}</h4>
                    <p className="text-gray-600 flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-1" />
                      {reference.email}
                    </p>
                    {reference.company && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <Building className="w-4 h-4 mr-1" />
                        {reference.company}
                      </p>
                    )}
                    {reference.work_year && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {reference.work_year}
                      </p>
                    )}
                    {reference.relationship && (
                      <p className="text-gray-500 text-sm">
                        Relationship: {reference.relationship}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}