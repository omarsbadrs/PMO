-- ============================================================
-- seed.sql — Demo / testing data
-- Run AFTER all migrations in Supabase SQL Editor
-- NOTE: Replace 'YOUR_GLOBAL_ADMIN_USER_ID' with your actual
--       auth.users.id after signing up for the first time.
-- ============================================================

-- Step 1: After you first sign up, get your user ID:
-- SELECT id, email FROM auth.users;

-- Step 2: Set yourself as global admin:
-- UPDATE user_profiles SET is_global_admin = TRUE WHERE email = 'your@email.com';

-- Step 3: Create demo projects (run as global admin or service role):

INSERT INTO projects (name, code, description, status, start_date, end_date)
VALUES
  ('Offshore Platform Alpha', 'OPA-2024', 'Offshore oil platform construction', 'active', '2024-01-01', '2026-12-31'),
  ('Refinery Upgrade Beta', 'RUB-2024', 'Refinery capacity upgrade project', 'active', '2024-06-01', '2025-12-31');

-- Step 4: Sample budget items (replace project_id with actual IDs after step 3)
-- Run: SELECT id, code FROM projects;
-- Then substitute below:

-- INSERT INTO cc_budget (project_id, code, description, discipline, baseline_amount, approved_amount, status)
-- VALUES
--   ('<project_id_1>', 'CC-001', 'Civil & Structural Works', 'Civil', 5000000, 5200000, 'approved'),
--   ('<project_id_1>', 'CC-002', 'Mechanical Equipment', 'Mechanical', 8000000, 8000000, 'approved'),
--   ('<project_id_1>', 'CC-003', 'Electrical & Instrumentation', 'E&I', 3000000, 3100000, 'approved');

-- Step 5: Sample milestone
-- INSERT INTO pl_milestones (project_id, name, planned_date, status, is_key_milestone)
-- VALUES
--   ('<project_id_1>', 'Foundation Complete', '2024-06-30', 'completed', TRUE),
--   ('<project_id_1>', 'Steel Structure Complete', '2024-12-31', 'pending', TRUE),
--   ('<project_id_1>', 'Mechanical Completion', '2025-09-30', 'pending', TRUE);
