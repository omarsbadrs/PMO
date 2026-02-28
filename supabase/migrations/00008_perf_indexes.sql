-- Better index for getUserModuleRole() which filters all 3 columns
-- (existing index only covers user_id + project_id)
CREATE INDEX IF NOT EXISTS idx_module_roles_lookup
  ON module_roles(user_id, project_id, module_key);

-- Sort indexes for common ordering patterns on list pages
CREATE INDEX IF NOT EXISTS idx_cc_budget_project_code
  ON cc_budget(project_id, code);
CREATE INDEX IF NOT EXISTS idx_cc_actuals_project_date
  ON cc_actuals(project_id, cost_date DESC);
CREATE INDEX IF NOT EXISTS idx_sf_incidents_project_date
  ON sf_incidents(project_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_ql_inspections_project_date
  ON ql_inspections(project_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs(created_at DESC);
