import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building, Briefcase, ChevronDown } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  organization_id: string;
}

interface RoleSelectionProps {
  selectedOrganization: string;
  selectedRole: string;
  onOrganizationChange: (orgId: string) => void;
  onRoleChange: (roleId: string) => void;
}

export function RoleSelection({
  selectedOrganization,
  selectedRole,
  onOrganizationChange,
  onRoleChange
}: RoleSelectionProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchRoles(selectedOrganization);
    } else {
      setRoles([]);
      onRoleChange('');
    }
  }, [selectedOrganization]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('title');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Details</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="organization"
              value={selectedOrganization}
              onChange={(e) => onOrganizationChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={!selectedOrganization}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}