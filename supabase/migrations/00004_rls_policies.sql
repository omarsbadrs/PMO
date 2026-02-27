-- ============================================================
-- 00004_rls_policies.sql
-- RLS helper functions + all Row Level Security policies
-- ============================================================

-- ── HELPER FUNCTIONS ────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT is_global_admin FROM user_profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION has_module_access(p_project_id UUID, p_module module_key_enum)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT is_global_admin() OR EXISTS (
    SELECT 1 FROM module_roles
    WHERE user_id = auth.uid()
      AND project_id = p_project_id
      AND module_key = p_module
  );
$$;

CREATE OR REPLACE FUNCTION can_write_module(p_project_id UUID, p_module module_key_enum)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT is_global_admin() OR EXISTS (
    SELECT 1 FROM module_roles
    WHERE user_id = auth.uid()
      AND project_id = p_project_id
      AND module_key = p_module
      AND role IN ('INPUT', 'MODULE_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION is_module_admin(p_project_id UUID, p_module module_key_enum)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT is_global_admin() OR EXISTS (
    SELECT 1 FROM module_roles
    WHERE user_id = auth.uid()
      AND project_id = p_project_id
      AND module_key = p_module
      AND role = 'MODULE_ADMIN'
  );
$$;

-- ── CORE TABLES ─────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (id = auth.uid() OR is_global_admin());
CREATE POLICY "profiles_update_own" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    is_global_admin() OR EXISTS (
      SELECT 1 FROM project_memberships
      WHERE user_id = auth.uid() AND project_id = projects.id AND is_active = TRUE
    )
  );
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (is_global_admin());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (is_global_admin());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (is_global_admin());

ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_select" ON project_memberships FOR SELECT
  USING (is_global_admin() OR user_id = auth.uid());
CREATE POLICY "memberships_insert" ON project_memberships FOR INSERT WITH CHECK (is_global_admin());
CREATE POLICY "memberships_update" ON project_memberships FOR UPDATE USING (is_global_admin());
CREATE POLICY "memberships_delete" ON project_memberships FOR DELETE USING (is_global_admin());

ALTER TABLE module_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_roles_select" ON module_roles FOR SELECT
  USING (is_global_admin() OR user_id = auth.uid());
CREATE POLICY "module_roles_insert" ON module_roles FOR INSERT WITH CHECK (is_global_admin());
CREATE POLICY "module_roles_update" ON module_roles FOR UPDATE USING (is_global_admin());
CREATE POLICY "module_roles_delete" ON module_roles FOR DELETE USING (is_global_admin());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (is_global_admin());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (TRUE);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (has_module_access(project_id, module_key));
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (has_module_access(project_id, module_key));
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (author_user_id = auth.uid() OR is_global_admin());
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (author_user_id = auth.uid() OR is_module_admin(project_id, module_key));

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_select" ON actions FOR SELECT
  USING (has_module_access(project_id, module_key));
CREATE POLICY "actions_insert" ON actions FOR INSERT
  WITH CHECK (can_write_module(project_id, module_key));
CREATE POLICY "actions_update" ON actions FOR UPDATE
  USING (can_write_module(project_id, module_key));
CREATE POLICY "actions_delete" ON actions FOR DELETE
  USING (is_module_admin(project_id, module_key));

-- ── COST CONTROL ─────────────────────────────────────────────

ALTER TABLE cc_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_budget_select" ON cc_budget FOR SELECT USING (has_module_access(project_id, 'cost_control'));
CREATE POLICY "cc_budget_insert" ON cc_budget FOR INSERT WITH CHECK (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_budget_update" ON cc_budget FOR UPDATE USING (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_budget_delete" ON cc_budget FOR DELETE USING (is_module_admin(project_id, 'cost_control'));

ALTER TABLE cc_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_commitments_select" ON cc_commitments FOR SELECT USING (has_module_access(project_id, 'cost_control'));
CREATE POLICY "cc_commitments_insert" ON cc_commitments FOR INSERT WITH CHECK (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_commitments_update" ON cc_commitments FOR UPDATE USING (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_commitments_delete" ON cc_commitments FOR DELETE USING (is_module_admin(project_id, 'cost_control'));

ALTER TABLE cc_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_actuals_select" ON cc_actuals FOR SELECT USING (has_module_access(project_id, 'cost_control'));
CREATE POLICY "cc_actuals_insert" ON cc_actuals FOR INSERT WITH CHECK (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_actuals_update" ON cc_actuals FOR UPDATE USING (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_actuals_delete" ON cc_actuals FOR DELETE USING (is_module_admin(project_id, 'cost_control'));

ALTER TABLE cc_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_forecasts_select" ON cc_forecasts FOR SELECT USING (has_module_access(project_id, 'cost_control'));
CREATE POLICY "cc_forecasts_insert" ON cc_forecasts FOR INSERT WITH CHECK (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_forecasts_update" ON cc_forecasts FOR UPDATE USING (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_forecasts_delete" ON cc_forecasts FOR DELETE USING (is_module_admin(project_id, 'cost_control'));

ALTER TABLE cc_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_changes_select" ON cc_changes FOR SELECT USING (has_module_access(project_id, 'cost_control'));
CREATE POLICY "cc_changes_insert" ON cc_changes FOR INSERT WITH CHECK (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_changes_update" ON cc_changes FOR UPDATE USING (can_write_module(project_id, 'cost_control'));
CREATE POLICY "cc_changes_delete" ON cc_changes FOR DELETE USING (is_module_admin(project_id, 'cost_control'));

-- ── PLANNING ─────────────────────────────────────────────────

ALTER TABLE pl_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_schedules_select" ON pl_schedules FOR SELECT USING (has_module_access(project_id, 'planning'));
CREATE POLICY "pl_schedules_insert" ON pl_schedules FOR INSERT WITH CHECK (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_schedules_update" ON pl_schedules FOR UPDATE USING (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_schedules_delete" ON pl_schedules FOR DELETE USING (is_module_admin(project_id, 'planning'));

ALTER TABLE pl_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_activities_select" ON pl_activities FOR SELECT USING (has_module_access(project_id, 'planning'));
CREATE POLICY "pl_activities_insert" ON pl_activities FOR INSERT WITH CHECK (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_activities_update" ON pl_activities FOR UPDATE USING (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_activities_delete" ON pl_activities FOR DELETE USING (is_module_admin(project_id, 'planning'));

ALTER TABLE pl_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_progress_select" ON pl_progress FOR SELECT USING (has_module_access(project_id, 'planning'));
CREATE POLICY "pl_progress_insert" ON pl_progress FOR INSERT WITH CHECK (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_progress_update" ON pl_progress FOR UPDATE USING (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_progress_delete" ON pl_progress FOR DELETE USING (is_module_admin(project_id, 'planning'));

ALTER TABLE pl_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_milestones_select" ON pl_milestones FOR SELECT USING (has_module_access(project_id, 'planning'));
CREATE POLICY "pl_milestones_insert" ON pl_milestones FOR INSERT WITH CHECK (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_milestones_update" ON pl_milestones FOR UPDATE USING (can_write_module(project_id, 'planning'));
CREATE POLICY "pl_milestones_delete" ON pl_milestones FOR DELETE USING (is_module_admin(project_id, 'planning'));

-- ── SAFETY ───────────────────────────────────────────────────

ALTER TABLE sf_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sf_incidents_select" ON sf_incidents FOR SELECT USING (has_module_access(project_id, 'safety'));
CREATE POLICY "sf_incidents_insert" ON sf_incidents FOR INSERT WITH CHECK (can_write_module(project_id, 'safety'));
CREATE POLICY "sf_incidents_update" ON sf_incidents FOR UPDATE USING (can_write_module(project_id, 'safety'));
CREATE POLICY "sf_incidents_delete" ON sf_incidents FOR DELETE USING (is_module_admin(project_id, 'safety'));

ALTER TABLE sf_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sf_observations_select" ON sf_observations FOR SELECT USING (has_module_access(project_id, 'safety'));
CREATE POLICY "sf_observations_insert" ON sf_observations FOR INSERT WITH CHECK (can_write_module(project_id, 'safety'));
CREATE POLICY "sf_observations_update" ON sf_observations FOR UPDATE USING (can_write_module(project_id, 'safety'));
CREATE POLICY "sf_observations_delete" ON sf_observations FOR DELETE USING (is_module_admin(project_id, 'safety'));

-- ── QUALITY ──────────────────────────────────────────────────

ALTER TABLE ql_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ql_inspections_select" ON ql_inspections FOR SELECT USING (has_module_access(project_id, 'quality'));
CREATE POLICY "ql_inspections_insert" ON ql_inspections FOR INSERT WITH CHECK (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_inspections_update" ON ql_inspections FOR UPDATE USING (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_inspections_delete" ON ql_inspections FOR DELETE USING (is_module_admin(project_id, 'quality'));

ALTER TABLE ql_ncr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ql_ncr_select" ON ql_ncr FOR SELECT USING (has_module_access(project_id, 'quality'));
CREATE POLICY "ql_ncr_insert" ON ql_ncr FOR INSERT WITH CHECK (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_ncr_update" ON ql_ncr FOR UPDATE USING (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_ncr_delete" ON ql_ncr FOR DELETE USING (is_module_admin(project_id, 'quality'));

ALTER TABLE ql_punch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ql_punch_select" ON ql_punch FOR SELECT USING (has_module_access(project_id, 'quality'));
CREATE POLICY "ql_punch_insert" ON ql_punch FOR INSERT WITH CHECK (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_punch_update" ON ql_punch FOR UPDATE USING (can_write_module(project_id, 'quality'));
CREATE POLICY "ql_punch_delete" ON ql_punch FOR DELETE USING (is_module_admin(project_id, 'quality'));

-- ── DOCUMENTS ────────────────────────────────────────────────

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_select" ON documents FOR SELECT
  USING (
    is_global_admin() OR
    (module_key IS NOT NULL AND has_module_access(project_id, module_key))
  );
CREATE POLICY "documents_insert" ON documents FOR INSERT
  WITH CHECK (
    module_key IS NOT NULL AND can_write_module(project_id, module_key)
  );
CREATE POLICY "documents_update" ON documents FOR UPDATE
  USING (
    module_key IS NOT NULL AND can_write_module(project_id, module_key)
  );
CREATE POLICY "documents_delete" ON documents FOR DELETE
  USING (
    is_global_admin() OR
    (module_key IS NOT NULL AND is_module_admin(project_id, module_key))
  );

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id
        AND (
          is_global_admin() OR
          (d.module_key IS NOT NULL AND has_module_access(d.project_id, d.module_key))
        )
    )
  );
-- Ingestion writes via service role (bypasses RLS)
