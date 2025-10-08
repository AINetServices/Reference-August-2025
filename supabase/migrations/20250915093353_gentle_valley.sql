/*
  # Reference Checking System Database Schema

  1. New Tables
    - `applications` - Store job application details, resume, and extracted data
    - `questions` - Predefined questions by role and organization
    - `references` - Reference contacts and their responses
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Features
    - Status tracking for applications and references
    - JSON storage for extracted data and questions
    - Comprehensive reference management system
*/

-- Applications table to store job applications and extracted resume data
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_url text NOT NULL,
  role text NOT NULL,
  organization text NOT NULL,
  extracted_data jsonb DEFAULT '{}',
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'extracted', 'approved', 'sent', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions table to store predefined questions by role and organization
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  organization text NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, organization)
);

-- References table to store reference contacts and their responses
CREATE TABLE IF NOT EXISTS references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  relationship text NOT NULL,
  years_worked text NOT NULL,
  questions_sent jsonb DEFAULT '[]',
  responses jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'overdue')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Users can manage their own applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for questions (read-only for authenticated users)
CREATE POLICY "Authenticated users can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for references (access through applications)
CREATE POLICY "Users can manage references for their applications"
  ON references
  FOR ALL
  TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for applications table
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample questions for common roles
INSERT INTO questions (role, organization, questions) VALUES
('Software Engineer', 'Tech Corp', '[
  "How would you rate the candidate''s technical skills and coding abilities?",
  "Can you describe a challenging project they worked on and how they handled it?",
  "How did they collaborate with team members and handle feedback?",
  "What are their strongest technical competencies?",
  "Would you recommend them for a senior software engineering position?"
]'),
('Marketing Manager', 'Digital Agency', '[
  "How would you evaluate their campaign management and strategic thinking?",
  "Can you provide examples of successful marketing initiatives they led?",
  "How did they handle budget management and ROI optimization?",
  "What are their strengths in team leadership and client relations?",
  "Would you hire them again for a marketing leadership role?"
]'),
('Data Scientist', 'Analytics Inc', '[
  "How would you assess their analytical and statistical modeling skills?",
  "Can you describe their experience with machine learning projects?",
  "How did they communicate complex findings to non-technical stakeholders?",
  "What programming languages and tools did they excel at?",
  "Would you recommend them for a senior data science position?"
]');