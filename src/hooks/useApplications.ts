// hooks/useApplications.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Application {
  id: string;
  user_id: string;
  resume_url: string;
  role_id: string;
  organization_id: string;
  extracted_data: any;
  status: 'processing' | 'extracted' | 'approved' | 'sent' | 'completed';
  created_at: string;
  updated_at: string;
  roles?: { name: string };
  organizations?: { name: string };
}

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('applications')
          .select(`
            *,
            roles (name),
            organizations (name)
          `)
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        setApplications(data || []);
      } catch (err) {
        // Proper error type handling
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return { applications, loading, error };
}