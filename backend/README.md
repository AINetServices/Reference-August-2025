# Reference Application Workflow System

A Python-only backend system that handles the complete flow of processing job application references using Supabase (Postgres + Auth + Storage) and Groq LLM, orchestrated with LangGraph.

## Features

- **Authentication**: Sign in, sign out, and forgot password using Supabase Auth
- **File Upload**: Resume upload (PDF/DOCX) to Supabase Storage
- **AI Parsing**: Extract structured candidate data and references using Groq LLM
- **Question Management**: Fetch predefined questions filtered by role and organization
- **Human-in-the-loop**: Manual review and approval process for questions
- **Reference Requests**: Automated creation of reference request records (email sending stubbed)

## Architecture

The system uses LangGraph to orchestrate the workflow with the following nodes:

1. **auth_node** - Authenticate user and verify session
2. **upload_node** - Upload resume file and create application record
3. **parse_resume_node** - Extract structured data using Groq LLM
4. **fetch_questions_node** - Get predefined questions from database
5. **queue_review_node** - Create question review record with pending status
6. **gate_approval_node** - Wait for manual approval before proceeding
7. **send_reference_requests_node** - Create reference request records

## Setup Instructions

### 1. Environment Setup

Create a `.env` file with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USE_LOCAL_FUNCTIONS=false
VITE_PARSE_RESUME_FUNCTION=parse-resume
GROQ_API_KEY=your_groq_api_key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Setup

The system expects the following Supabase tables:

```sql
-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES profiles(id),
  role_id uuid,
  organization_id uuid,
  resume_file_path text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now()
);

-- Questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid,
  organization_id uuid,
  text text,
  category text
);

-- Question Reviews
CREATE TABLE question_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id),
  questions jsonb,
  status text DEFAULT 'pending',
  reviewer_id uuid,
  reviewed_at timestamptz
);

-- Candidate References
CREATE TABLE candidate_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id),
  name text,
  email text,
  company text,
  worked_together text,
  year text
);

-- Reference Requests
CREATE TABLE reference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_reference_id uuid REFERENCES candidate_references(id),
  questions jsonb,
  status text DEFAULT 'queued',
  sent_at timestamptz
);
```

### 4. Storage Setup

Create a Supabase Storage bucket named `resumes` for storing resume files.

## Usage

### Run Complete Demo Workflow

```bash
python main.py demo
```

This will:
1. Create sample data (questions)
2. Create a sample resume file
3. Run through authentication
4. Execute the complete workflow
5. Stop at the approval gate

### List Pending Reviews

```bash
python main.py list
```

### Approve a Question Review

```bash
python main.py approve <application_id>
```

### Test Authentication Only

```bash
python main.py auth
```

## Module Overview

- **auth.py** - Supabase authentication (sign in/out/forgot password)
- **storage.py** - File upload/download to Supabase Storage
- **db.py** - Database CRUD operations for all tables
- **parser.py** - Resume parsing with Groq LLM (PDF/DOCX support)
- **graph.py** - LangGraph workflow orchestration
- **main.py** - CLI interface and demo functions

## LLM Extraction

The system uses Groq's `llama3-70b-8192` model to extract structured data from resumes:

```json
{
  "full_name": "string | null",
  "references": [
    {
      "name": "string | null",
      "email": "string | null", 
      "company": "string | null",
      "worked_together_context": "string | null",
      "year": "string | null"
    }
  ]
}
```

## Workflow State

The LangGraph workflow maintains the following state:

```python
{
  "user_id": "str | None",
  "application_id": "str | None", 
  "resume_path": "str | None",
  "parsed": "dict | None",
  "questions": "list | None",
  "approval_status": "str | None"
}
```

## Security Notes

- All database tables should have Row Level Security (RLS) enabled
- Users should only access their own data
- File uploads are scoped to user directories
- Authentication tokens are managed by Supabase Auth

## Limitations

- Email sending is stubbed (logs only)
- Demo mode bypasses authentication for testing
- Sample data uses hardcoded UUIDs for roles/organizations
- File parsing is basic (production would need more robust handling)

## Production Considerations

1. Implement proper RLS policies
2. Add real email sending (SMTP/SendGrid/etc.)
3. Add proper role/organization management
4. Implement better error handling and retries
5. Add logging and monitoring
6. Use proper UUID generation for all IDs
7. Add input validation and sanitization
8. Implement proper session management