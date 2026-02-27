// SERVER-SIDE ONLY — queries structured DB tables for AI context
import { createAdminClient } from '@/lib/supabase/admin'

export async function getStructuredContext(
  message: string,
  projectId: string,
  moduleKey?: string,
): Promise<string> {
  const admin = createAdminClient()
  const q = message.toLowerCase()
  const sections: string[] = []

  const isCost = !moduleKey || moduleKey === 'cost_control'
  const isPlan = !moduleKey || moduleKey === 'planning'
  const isSafe = !moduleKey || moduleKey === 'safety'
  const isQual = !moduleKey || moduleKey === 'quality'

  // ── COST CONTROL ────────────────────────────────────────────────
  if (isCost && q.match(/budget|cost|spend|financial|money|fund|amount/)) {
    const { data } = await admin
      .from('cc_budget')
      .select('code, description, discipline, approved_amount, baseline_amount, status')
      .eq('project_id', projectId)
      .limit(50)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.approved_amount ?? 0), 0)
      sections.push(
        `[data: Budget Line Items]\nTotal approved budget: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        data.map((r) =>
          `- ${r.code ?? 'N/A'} | ${r.description} | ${r.discipline ?? ''} | Approved: $${(r.approved_amount ?? 0).toLocaleString()} | Status: ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/commitment|purchase.?order|\bpo\b|vendor/)) {
    const { data } = await admin
      .from('cc_commitments')
      .select('po_number, vendor, description, amount, currency, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.amount ?? 0), 0)
      sections.push(
        `[data: Commitments]\nTotal commitments: $${total.toLocaleString()}\n` +
        data.map((r) =>
          `- PO: ${r.po_number ?? 'N/A'} | ${r.vendor} | ${r.description} | $${(r.amount ?? 0).toLocaleString()} ${r.currency} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/actual|invoice|spent|expenditure|paid/)) {
    const { data } = await admin
      .from('cc_actuals')
      .select('invoice_number, vendor, description, amount, cost_date, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      const total = data.reduce((s, r) => s + (r.amount ?? 0), 0)
      sections.push(
        `[data: Actual Costs]\nTotal actuals: $${total.toLocaleString()}\n` +
        data.map((r) =>
          `- Inv: ${r.invoice_number ?? 'N/A'} | ${r.vendor ?? 'N/A'} | ${r.description} | $${(r.amount ?? 0).toLocaleString()} | ${r.cost_date ?? 'N/A'}`
        ).join('\n')
      )
    }
  }

  if (isCost && q.match(/change.?order|variation|change/)) {
    const { data } = await admin
      .from('cc_changes')
      .select('change_number, title, type, status, amount, approved_amount')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Change Orders]\n` +
        data.map((r) =>
          `- ${r.change_number ?? 'N/A'} | ${r.title} | ${r.type ?? 'N/A'} | ${r.status} | Requested: $${(r.amount ?? 0).toLocaleString()} | Approved: $${(r.approved_amount ?? 0).toLocaleString()}`
        ).join('\n')
      )
    }
  }

  // ── PLANNING ─────────────────────────────────────────────────────
  if (isPlan && q.match(/milestone|deadline|key date|target/)) {
    const { data } = await admin
      .from('pl_milestones')
      .select('name, planned_date, actual_date, status, is_key_milestone')
      .eq('project_id', projectId)
      .order('planned_date')
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Milestones]\n` +
        data.map((r) =>
          `- ${r.is_key_milestone ? '[KEY] ' : ''}${r.name} | Planned: ${r.planned_date ?? 'N/A'} | Actual: ${r.actual_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isPlan && q.match(/activit|schedule|progress|percent|complet/)) {
    const { data } = await admin
      .from('pl_activities')
      .select('name, planned_start, planned_finish, percent_complete, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      const avg = data.reduce((s, r) => s + (r.percent_complete ?? 0), 0) / data.length
      sections.push(
        `[data: Activities]\nAverage progress: ${avg.toFixed(1)}%\n` +
        data.map((r) =>
          `- ${r.name} | ${r.planned_start ?? 'N/A'} → ${r.planned_finish ?? 'N/A'} | ${r.percent_complete ?? 0}% | ${r.status}`
        ).join('\n')
      )
    }
  }

  // ── SAFETY ───────────────────────────────────────────────────────
  if (isSafe && q.match(/incident|accident|injur|safety|near.?miss|lti|fatality/)) {
    const { data } = await admin
      .from('sf_incidents')
      .select('incident_number, title, severity, incident_date, status')
      .eq('project_id', projectId)
      .order('incident_date', { ascending: false })
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Safety Incidents]\n` +
        data.map((r) =>
          `- ${r.incident_number ?? 'N/A'} | ${r.title} | ${r.severity ?? 'N/A'} | ${r.incident_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isSafe && q.match(/observation|unsafe|hazard/)) {
    const { data } = await admin
      .from('sf_observations')
      .select('observation_number, type, description, observed_date, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Safety Observations]\n` +
        data.map((r) =>
          `- ${r.observation_number ?? 'N/A'} | ${r.type ?? 'N/A'} | ${r.description} | ${r.observed_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  // ── QUALITY ──────────────────────────────────────────────────────
  if (isQual && q.match(/inspection|test|quality.?check/)) {
    const { data } = await admin
      .from('ql_inspections')
      .select('inspection_number, title, type, inspection_date, result, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Inspections]\n` +
        data.map((r) =>
          `- ${r.inspection_number ?? 'N/A'} | ${r.title} | ${r.type ?? 'N/A'} | ${r.inspection_date ?? 'N/A'} | Result: ${r.result ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isQual && q.match(/ncr|non.?conformance|defect|non.?conformit/)) {
    const { data } = await admin
      .from('ql_ncr')
      .select('ncr_number, title, severity, raised_date, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Non-Conformance Reports]\n` +
        data.map((r) =>
          `- ${r.ncr_number ?? 'N/A'} | ${r.title} | ${r.severity ?? 'N/A'} | ${r.raised_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  if (isQual && q.match(/punch|snagging|deficien/)) {
    const { data } = await admin
      .from('ql_punch')
      .select('punch_number, title, category, raised_date, status')
      .eq('project_id', projectId)
      .limit(30)
    if (data?.length) {
      sections.push(
        `[data: Punch List]\n` +
        data.map((r) =>
          `- ${r.punch_number ?? 'N/A'} | ${r.title} | ${r.category ?? 'N/A'} | ${r.raised_date ?? 'N/A'} | ${r.status}`
        ).join('\n')
      )
    }
  }

  return sections.join('\n\n')
}
