import { createClient } from '@supabase/supabase-js'

// Get environment variables with proper validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: check if env variables are loading
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

// Validate environment variables before creating client
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Please check your .env file and make sure it contains VITE_SUPABASE_URL=your_url'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Please check your .env file and make sure it contains VITE_SUPABASE_ANON_KEY=your_key'
  )
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error(
    `Invalid Supabase URL: ${supabaseUrl}. Must start with https://`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ... rest of your types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          resume_url: string
          role: string
          organization: string
          extracted_data: Json
          status: 'processing' | 'extracted' | 'approved' | 'sent' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resume_url: string
          role: string
          organization: string
          extracted_data?: Json
          status?: 'processing' | 'extracted' | 'approved' | 'sent' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resume_url?: string
          role?: string
          organization?: string
          extracted_data?: Json
          status?: 'processing' | 'extracted' | 'approved' | 'sent' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          role: string
          organization: string
          questions: Json
          created_at: string
        }
        Insert: {
          id?: string
          role: string
          organization: string
          questions: Json
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          organization?: string
          questions?: Json
          created_at?: string
        }
      }
      references: {
        Row: {
          id: string
          application_id: string
          name: string
          email: string
          company: string
          relationship: string
          years_worked: string
          questions_sent: Json
          responses: Json
          status: 'pending' | 'sent' | 'responded' | 'overdue'
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          name: string
          email: string
          company: string
          relationship: string
          years_worked: string
          questions_sent?: Json
          responses?: Json
          status?: 'pending' | 'sent' | 'responded' | 'overdue'
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          name?: string
          email?: string
          company?: string
          relationship?: string
          years_worked?: string
          questions_sent?: Json
          responses?: Json
          status?: 'pending' | 'sent' | 'responded' | 'overdue'
          created_at?: string
        }
      }
    }
  }
}