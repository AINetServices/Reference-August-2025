/*
  # Add organizations table and update schema

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `created_at` (timestamp)
    - `users` (if not exists)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)

  2. Table Updates
    - Update `roles` table to reference organizations
    - Update `candidates` table structure
    - Update `questions` table structure

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies

  4. Sample Data
    - Add sample organizations and roles for testing
*/

-- Create users table if it doesn't exist (for auth.users reference)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are publicly readable"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Update roles table to include organization_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE roles ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Update questions table to include organization_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Update candidates table to include organization_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE candidates ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Update candidates table to include resume_url if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE candidates ADD COLUMN resume_url text;
  END IF;
END $$;

-- Update candidates table to include role_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE candidates ADD COLUMN role_id uuid REFERENCES roles(id);
  END IF;
END $$;

-- Update candidates table to include status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'status'
  ) THEN
    ALTER TABLE candidates ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;

-- Update candidates table to include name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'name'
  ) THEN
    ALTER TABLE candidates ADD COLUMN name text;
  END IF;
END $$;

-- Update questions table to include question_text if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'question_text'
  ) THEN
    ALTER TABLE questions ADD COLUMN question_text text;
  END IF;
END $$;

-- Update reference_requests table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reference_requests' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE reference_requests ADD COLUMN approved_by uuid REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reference_requests' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE reference_requests ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reference_requests' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE reference_requests ADD COLUMN sent_at timestamptz;
  END IF;
END $$;

-- Insert sample organizations
INSERT INTO organizations (name) VALUES 
  ('TechCorp Inc.'),
  ('Global Solutions Ltd.'),
  ('Innovation Labs'),
  ('Digital Dynamics')
ON CONFLICT (name) DO NOTHING;

-- Insert sample roles
INSERT INTO roles (role_name, company_name, title, organization_id) 
SELECT 
  'Software Engineer',
  'TechCorp Inc.',
  'Senior Software Engineer',
  o.id
FROM organizations o 
WHERE o.name = 'TechCorp Inc.'
ON CONFLICT (title) DO NOTHING;

INSERT INTO roles (role_name, company_name, title, organization_id) 
SELECT 
  'Product Manager',
  'Global Solutions Ltd.',
  'Senior Product Manager',
  o.id
FROM organizations o 
WHERE o.name = 'Global Solutions Ltd.'
ON CONFLICT (title) DO NOTHING;

INSERT INTO roles (role_name, company_name, title, organization_id) 
SELECT 
  'Data Scientist',
  'Innovation Labs',
  'Lead Data Scientist',
  o.id
FROM organizations o 
WHERE o.name = 'Innovation Labs'
ON CONFLICT (title) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (question, role_id, organization_id, question_text)
SELECT 
  'How would you rate the candidate''s technical skills?',
  r.id,
  r.organization_id,
  'How would you rate the candidate''s technical skills on a scale of 1-10 and why?'
FROM roles r 
WHERE r.title = 'Senior Software Engineer'
ON CONFLICT (role_id, question) DO NOTHING;

INSERT INTO questions (question, role_id, organization_id, question_text)
SELECT 
  'Describe the candidate''s work ethic and reliability.',
  r.id,
  r.organization_id,
  'Can you describe the candidate''s work ethic and reliability during your time working together?'
FROM roles r 
WHERE r.title = 'Senior Software Engineer'
ON CONFLICT (role_id, question) DO NOTHING;

INSERT INTO questions (question, role_id, organization_id, question_text)
SELECT 
  'How did the candidate handle challenging situations?',
  r.id,
  r.organization_id,
  'Can you provide an example of how the candidate handled a challenging situation or project?'
FROM roles r 
WHERE r.title = 'Senior Product Manager'
ON CONFLICT (role_id, question) DO NOTHING;

INSERT INTO questions (question, role_id, organization_id, question_text)
SELECT 
  'What are the candidate''s strengths and areas for improvement?',
  r.id,
  r.organization_id,
  'What would you say are the candidate''s main strengths and areas for improvement?'
FROM roles r 
WHERE r.title = 'Lead Data Scientist'
ON CONFLICT (role_id, question) DO NOTHING;