// SERVER-SIDE ONLY — queries structured DB tables for AI context
import { createAdminClient } from '@/lib/supabase/admin'

export async function getStructuredContext(
  message: string,
  projectId: string | string[],
  moduleKey?: string,
): Promise<string> {
  const admin = createAdminClient()
  const q = message.toLowerCase()
  const sections: string[] = []

  // Resolve to array and apply the right filter builder
  const ids = Array.isArray(projectId) ? projectId : [projectId]
  const multi = ids.length > 1

  // Fetch project names for multi-project labelling
  let projectNames: Record<string, string> = {}
  if (multi) {
    const { data: projects } = await admin.from('projects').select('id, name').in('id', ids)
    projectNames = Object.fromEntries((projects ?? []).map((p) => [p.id, p.name]))
  }

  const isCost = !moduleKey || moduleKey === 'cost_control'
  const isPlan = !moduleKey || moduleKey === 'planning'
  const isSafe = !moduleKey || moduleKey === 'safety'
  const isQual = !moduleKey || moduleKey === 'quality'

  // ── COST CONTROL ────────────────────────────────────────────────
  if (isCost && q.match(/budget|cost|spend|financial|money|fund|amount/)) {
    const query = admin
      .from('cc_budget')
      .select('project_id, code, description, discipline, approved_amount, baseline_amount, status')
      .limit(50)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.approved_amount ?? 0), 0)
      sections.push(
        `[data: Budget Line Items]\nTotal approved budget: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.code ?? 'N/A'} | ${r.description} | ${r.discipline ?? ''} | Approved: $${(r.approved_amount ?? 0).toLocaleString()} | Status: ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/commitment|purchase.?order|\bpo\b|vendor/)) {
    const query = admin
      .from('cc_commitments')
      .select('project_id, po_number, vendor, description, amount, currency, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.amount ?? 0), 0)
      sections.push(
        `[data: Commitments]\nTotal commitments: $${total.toLocaleString()}\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}PO: ${r.po_number ?? 'N/A'} | ${r.vendor} | ${r.description} | $${(r.amount ?? 0).toLocaleString()} ${r.currency} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/actual|invoice|spent|expenditure|paid/)) {
    const query = admin
      .from('cc_actuals')
      .select('project_id, invoice_number, vendor, description, amount, cost_date, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.amount ?? 0), 0)
      sections.push(
        `[data: Actual Costs]\nTotal actuals: $${total.toLocaleString()}\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}Inv: ${r.invoice_number ?? 'N/A'} | ${r.vendor ?? 'N/A'} | ${r.description} | $${(r.amount ?? 0).toLocaleString()} | ${r.cost_date ?? 'N/A'}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/change.?order|variation|change/)) {
    const query = admin
      .from('cc_changes')
      .select('project_id, change_number, title, type, status, amount, approved_amount')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Change Orders]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.change_number ?? 'N/A'} | ${r.title} | ${r.type ?? 'N/A'} | ${r.status} | Requested: $${(r.amount ?? 0).toLocaleString()} | Approved: $${(r.approved_amount ?? 0).toLocaleString()}`
        ).join('\n')
      )
    }
  }

  // ── PLANNING ─────────────────────────────────────────────────────
  if (isPlan && q.match(/milestone|deadline|key date|target/)) {
    const query = admin
      .from('pl_milestones')
      .select('project_id, name, planned_date, actual_date, status, is_key_milestone')
      .order('planned_date')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Milestones]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.is_key_milestone ? '[KEY] ' : ''}${r.name} | Planned: ${r.planned_date ?? 'N/A'} | Actual: ${r.actual_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isPlan && q.match(/activit|schedule|progress|percent|complet/)) {
    const query = admin
      .from('pl_activities')
      .select('project_id, name, planned_start, planned_finish, percent_complete, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      const avg = data.reduce((s, r) => s + (r.percent_complete ?? 0), 0) / data.length
      sections.push(
        `[data: Activities]\nAverage progress: ${avg.toFixed(1)}%\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.name} | ${r.planned_start ?? 'N/A'} → ${r.planned_finish ?? 'N/A'} | ${r.percent_complete ?? 0}% | ${r.status}`
        ).join('\n')
      )
    }
  }

  // ── SAFETY ───────────────────────────────────────────────────────
  if (isSafe && q.match(/incident|accident|injur|safety|near.?miss|lti|fatality/)) {
    const query = admin
      .from('sf_incidents')
      .select('project_id, incident_number, title, severity, incident_date, status')
      .order('incident_date', { ascending: false })
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Safety Incidents]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.incident_number ?? 'N/A'} | ${r.title} | ${r.severity ?? 'N/A'} | ${r.incident_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isSafe && q.match(/observation|unsafe|hazard/)) {
    const query = admin
      .from('sf_observations')
      .select('project_id, observation_number, type, description, observed_date, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Safety Observations]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.observation_number ?? 'N/A'} | ${r.type ?? 'N/A'} | ${r.description} | ${r.observed_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  // ── QUALITY ──────────────────────────────────────────────────────
  if (isQual && q.match(/inspection|test|quality.?check/)) {
    const query = admin
      .from('ql_inspections')
      .select('project_id, inspection_number, title, type, inspection_date, result, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Inspections]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.inspection_number ?? 'N/A'} | ${r.title} | ${r.type ?? 'N/A'} | ${r.inspection_date ?? 'N/A'} | Result: ${r.result ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isQual && q.match(/ncr|non.?conformance|defect|non.?conformit/)) {
    const query = admin
      .from('ql_ncr')
      .select('project_id, ncr_number, title, severity, raised_date, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Non-Conformance Reports]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.ncr_number ?? 'N/A'} | ${r.title} | ${r.severity ?? 'N/A'} | ${r.raised_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isQual && q.match(/punch|snagging|deficien/)) {
    const query = admin
      .from('ql_punch')
      .select('project_id, punch_number, title, category, raised_date, status')
      .limit(30)
    const { data } = ids.length === 1
      ? await query.eq('project_id', ids[0])
      : await query.in('project_id', ids)
    if (data?.length) {
      sections.push(
        `[data: Punch List]\n` +
        data.map((r) =>
          `- ${multi ? `[${projectNames[r.project_id] ?? r.project_id}] ` : ''}${r.punch_number ?? 'N/A'} | ${r.title} | ${r.category ?? 'N/A'} | ${r.raised_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  return sections.join('\n\n')
}
