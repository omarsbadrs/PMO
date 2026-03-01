export type UserRole = 'GLOBAL_ADMIN' | 'MODULE_ADMIN' | 'INPUT' | 'VIEWER'
export type AppRole = 'admin' | 'manager' | 'user'
export type ModuleKey = 'cost_control' | 'planning' | 'safety' | 'quality'
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type ActionStatus = 'open' | 'in_progress' | 'closed' | 'cancelled'
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'
export type IncidentSeverity = 'near_miss' | 'first_aid' | 'medical_treatment' | 'lti' | 'fatality'
export type IngestionStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface UserProfile {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
  is_global_admin: boolean
  role: AppRole
  department: string | null
  job_title: string | null
  tier: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProjectCurrency = 'USD' | 'EUR' | 'SAR' | 'EGP' | 'GBP'

export interface Project {
  id: string
  name: string
  code: string
  description: string | null
  status: ProjectStatus
  currency: ProjectCurrency
  usd_rate: number
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ModuleRole {
  id: string
  user_id: string
  project_id: string
  module_key: ModuleKey
  role: Exclude<UserRole, 'GLOBAL_ADMIN'>
  created_at: string
  user_profiles?: UserProfile
}

export interface Document {
  id: string
  project_id: string
  module_key: ModuleKey | null
  entity_type: string | null
  entity_id: string | null
  file_name: string
  file_path: string
  mime_type: string
  size_bytes: number | null
  uploaded_by: string | null
  uploaded_at: string
  revision: string | null
  tags: string[] | null
  description: string | null
  ingestion_status: IngestionStatus
  user_profiles?: UserProfile
}

export interface Comment {
  id: string
  project_id: string
  module_key: ModuleKey
  entity_type: string
  entity_id: string
  author_user_id: string | null
  body: string
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

export interface Action {
  id: string
  project_id: string
  module_key: ModuleKey
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  owner_user_id: string | null
  due_date: string | null
  status: ActionStatus
  priority: ActionPriority
  created_by: string | null
  created_at: string
  updated_at: string
  owner?: UserProfile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  payload_json: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  before_json: Record<string, unknown> | null
  after_json: Record<string, unknown> | null
  created_at: string
  actor?: UserProfile
}

// Module-specific types
export interface CcBudget {
  id: string
  project_id: string
  code: string | null
  description: string
  discipline: string | null
  baseline_amount: number | null
  approved_amount: number | null
  revision_number: number
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
}

export interface CcCommitment {
  id: string
  project_id: string
  po_number: string | null
  vendor: string
  description: string
  amount: number | null
  currency: string
  fx_rate: number
  status: string
  issue_date: string | null
  expiry_date: string | null
  budget_id: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
}

export interface CcActual {
  id: string
  project_id: string
  commitment_id: string | null
  budget_id: string | null
  invoice_number: string | null
  vendor: string | null
  description: string
  amount: number
  document_currency: string
  fx_rate: number
  cost_date: string | null
  status: string
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
}

export interface CcForecast {
  id: string
  project_id: string
  budget_id: string | null
  period: string
  eac: number | null
  etc: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
}

export interface CcChange {
  id: string
  project_id: string
  change_number: string | null
  title: string
  description: string | null
  type: string | null
  status: string
  amount: number | null
  approved_amount: number | null
  submitted_date: string | null
  approved_date: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
}

export interface PlSchedule {
  id: string; project_id: string; name: string; type: string | null
  revision_number: number; baseline_date: string | null; data_date: string | null
  status: string; notes: string | null; created_by: string | null
  created_at: string; updated_by: string | null; updated_at: string
}

export interface PlActivity {
  id: string; project_id: string; schedule_id: string | null; activity_id: string | null
  name: string; wbs: string | null; planned_start: string | null; planned_finish: string | null
  actual_start: string | null; actual_finish: string | null; duration_days: number | null
  percent_complete: number; status: string; created_by: string | null
  created_at: string; updated_by: string | null; updated_at: string
}

export interface PlProgress {
  id: string; project_id: string; activity_id: string | null; report_date: string
  percent_complete: number | null; notes: string | null; created_by: string | null
  created_at: string; updated_by: string | null; updated_at: string
}

export interface PlMilestone {
  id: string; project_id: string; name: string; description: string | null
  planned_date: string | null; actual_date: string | null; status: string
  is_key_milestone: boolean; created_by: string | null
  created_at: string; updated_by: string | null; updated_at: string
}

export interface SfIncident {
  id: string; project_id: string; incident_number: string | null; title: string
  description: string | null; severity: IncidentSeverity | null
  incident_date: string | null; location: string | null; injured_person: string | null
  root_cause: string | null; status: string; reported_by: string | null
  created_by: string | null; created_at: string; updated_by: string | null; updated_at: string
}

export interface SfObservation {
  id: string; project_id: string; observation_number: string | null; type: string | null
  description: string; location: string | null; observed_date: string | null
  observed_by: string | null; status: string; corrective_action: string | null
  closed_date: string | null; created_by: string | null
  created_at: string; updated_by: string | null; updated_at: string
}

export interface QlInspection {
  id: string; project_id: string; inspection_number: string | null; title: string
  type: string | null; description: string | null; inspection_date: string | null
  inspector: string | null; result: string | null; status: string; notes: string | null
  created_by: string | null; created_at: string; updated_by: string | null; updated_at: string
}

export interface QlNcr {
  id: string; project_id: string; ncr_number: string | null; title: string
  description: string | null; severity: string | null; area: string | null
  raised_date: string | null; raised_by: string | null; due_date: string | null
  closed_date: string | null; root_cause: string | null; corrective_action: string | null
  status: string; created_by: string | null; created_at: string
  updated_by: string | null; updated_at: string
}

export interface QlPunch {
  id: string; project_id: string; punch_number: string | null; title: string
  description: string | null; category: string | null; area: string | null
  raised_date: string | null; raised_by: string | null; due_date: string | null
  closed_date: string | null; assigned_to: string | null; status: string
  created_by: string | null; created_at: string; updated_by: string | null; updated_at: string
}

export type PaginatedResult<T> = {
  data: T[]
  count: number
  page: number
  pageSize: number
}
