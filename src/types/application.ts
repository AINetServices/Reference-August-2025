export interface Application {
  id: string
  applicant_id: string | null
  role_id: string | null
  organization_id: string | null
  resume_file_path: string | null
  status: string
  created_at: string

  // Joined data
  roles?: { title: string }
  organizations?: { name: string }
}
