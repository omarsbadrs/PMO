-- ============================================================
-- 00006_indexes.sql
-- Performance indexes for all module + cross-cutting tables
-- ============================================================

-- Cost Control
CREATE INDEX ON cc_budget(project_id);
CREATE INDEX ON cc_commitments(project_id);
CREATE INDEX ON cc_actuals(project_id);
CREATE INDEX ON cc_forecasts(project_id);
CREATE INDEX ON cc_changes(project_id);

-- Planning
CREATE INDEX ON pl_schedules(project_id);
CREATE INDEX ON pl_activities(project_id);
CREATE INDEX ON pl_activities(schedule_id);
CREATE INDEX ON pl_progress(project_id);
CREATE INDEX ON pl_milestones(project_id);

-- Safety
CREATE INDEX ON sf_incidents(project_id);
CREATE INDEX ON sf_observations(project_id);

-- Quality
CREATE INDEX ON ql_inspections(project_id);
CREATE INDEX ON ql_ncr(project_id);
CREATE INDEX ON ql_punch(project_id);

-- Documents
CREATE INDEX ON documents(project_id, module_key);
CREATE INDEX ON documents(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX ON document_chunks(document_id);

-- Vector similarity search index (requires pgvector)
-- Adjust 'lists' based on row count: sqrt(row_count) is a good starting point
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Cross-cutting
CREATE INDEX ON comments(project_id, module_key, entity_id);
CREATE INDEX ON actions(project_id, module_key, status);
CREATE INDEX ON notifications(user_id, read_at);
CREATE INDEX ON audit_logs(table_name, record_id, created_at DESC);
CREATE INDEX ON project_memberships(user_id, is_active);
CREATE INDEX ON module_roles(user_id, project_id);
