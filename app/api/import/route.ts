import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TABLES: Record<string, string> = {
  cc_budget: 'cost_control',
  cc_commitments: 'cost_control',
  cc_actuals: 'cost_control',
  cc_forecasts: 'cost_control',
  cc_changes: 'cost_control',
  pl_schedules: 'planning',
  pl_activities: 'planning',
  pl_milestones: 'planning',
  sf_incidents: 'safety',
  sf_observations: 'safety',
  ql_inspections: 'quality',
  ql_ncr: 'quality',
  ql_punch: 'quality',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { table, projectId, rows } = await req.json()

  if (!table || !ALLOWED_TABLES[table]) {
    return Response.json({ error: 'Invalid table' }, { status: 400 })
  }
  if (!projectId || !Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: 'projectId and rows are required' }, { status: 400 })
  }

  const moduleKey = ALLOWED_TABLES[table]

  // Check permissions
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_global_admin) {
    const { data: role } = await supabase
      .from('module_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('module_key', moduleKey)
      .single()

    if (!role || !['MODULE_ADMIN', 'INPUT'].includes(role.role)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  const admin = createAdminClient()

  const enrichedRows = (rows as Record<string, unknown>[]).map((row) => ({
    ...row,
    project_id: projectId,
    created_by: user.id,
    updated_by: user.id,
  }))

  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < enrichedRows.length; i += 100) {
    const batch = enrichedRows.slice(i, i + 100)
    const { error, count } = await admin.from(table).insert(batch, { count: 'exact' })
    if (error) {
      errors.push(`Rows ${i + 1}–${i + batch.length}: ${error.message}`)
    } else {
      inserted += count ?? batch.length
    }
  }

  return Response.json({ inserted, errors })
}
