import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          title: string;
          role_name: string;
          company_name: string;
          description: string | null;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          role_name: string;
          company_name: string;
          description?: string | null;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          role_name?: string;
          company_name?: string;
          description?: string | null;
          organization_id?: string;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          question: string;
          question_text: string;
          role_id: string;
          organization_id: string;
          active: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          question_text: string;
          role_id: string;
          organization_id: string;
          active?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          question_text?: string;
          role_id?: string;
          organization_id?: string;
          active?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          name: string;
          resume_url: string | null;
          role_id: string | null;
          organization_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          name: string;
          resume_url?: string | null;
          role_id?: string | null;
          organization_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          name?: string;
          resume_url?: string | null;
          role_id?: string | null;
          organization_id?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          candidate_id: string | null;
          file_path: string;
          parsed_json: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id?: string | null;
          file_path: string;
          parsed_json?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string | null;
          file_path?: string;
          parsed_json?: any | null;
          created_at?: string;
        };
      };
      references: {
        Row: {
          id: string;
          candidate_id: string;
          name: string;
          email: string;
          company: string | null;
          work_year: string | null;
          relationship: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          name: string;
          email: string;
          company?: string | null;
          work_year?: string | null;
          relationship?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          work_year?: string | null;
          relationship?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      referees: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          employer: string | null;
          position: string | null;
          relationship: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          employer?: string | null;
          position?: string | null;
          relationship?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          employer?: string | null;
          position?: string | null;
          relationship?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          resume_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          resume_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          resume_url?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      reference_requests: {
        Row: {
          id: string;
          candidate_id: string;
          reference_id: string;
          role_id: string;
          questions: any;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          reference_id: string;
          role_id: string;
          questions: any;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          reference_id?: string;
          role_id?: string;
          questions?: any;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      reference_request_questions: {
        Row: {
          id: string;
          reference_request_id: string;
          question_id: string;
          question_text: string;
          approved: boolean;
          answer_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reference_request_id: string;
          question_id: string;
          question_text: string;
          approved?: boolean;
          answer_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reference_request_id?: string;
          question_id?: string;
          question_text?: string;
          approved?: boolean;
          answer_text?: string | null;
          created_at?: string;
        };
      };
      question_reviews: {
        Row: {
          id: string;
          candidate_id: string | null;
          role_id: string | null;
          draft: any;
          status: string | null;
          reviewer_user: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id?: string | null;
          role_id?: string | null;
          draft: any;
          status?: string | null;
          reviewer_user?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          candidate_id?: string | null;
          role_id?: string | null;
          draft?: any;
          status?: string | null;
          reviewer_user?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};