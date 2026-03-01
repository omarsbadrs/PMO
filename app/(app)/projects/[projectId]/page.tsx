import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUser, getUserProfile, getUserModuleRole } from '@/lib/auth/helpers'
import ProjectDashboardKPIs from '@/components/dashboard/ProjectDashboardKPIs'
import type { CostData, PlanningData, SafetyData, QualityData } from '@/types/dashboard'

type Supabase = Awaited<ReturnType<typeof createClient>>

// ── Data fetchers ──────────────────────────────────────────────────

async function fetchCostData(db: Supabase, projectId: string, currency: string): Promise<CostData> {
  const [budget, actuals, commitments, changes] = await Promise.all([
    db.from('cc_budget').select('approved_amount, baseline_amount').eq('project_id', projectId),
    db.from('cc_actuals').select('amount, fx_rate').eq('project_id', projectId),
    db.from('cc_commitments').select('amount, fx_rate').eq('project_id', projectId),
    db.from('cc_changes').select('status').eq('project_id', projectId),
  ])
  return {
    currency,
    totalBudget:      budget.data?.reduce((s, r) => s + (r.approved_amount ?? r.baseline_amount ?? 0), 0) ?? 0,
    totalActuals:     actuals.data?.reduce((s, r) => s + (r.amount ?? 0) * (r.fx_rate ?? 1), 0) ?? 0,
    totalCommitments: commitments.data?.reduce((s, r) => s + (r.amount ?? 0) * (r.fx_rate ?? 1), 0) ?? 0,
    openChanges:      changes.data?.filter(c => ['draft', 'pending', 'submitted'].includes(c.status ?? '')).length ?? 0,
  }
}

async function fetchPlanningData(db: Supabase, projectId: string): Promise<PlanningData> {
  const [activities, milestones] = await Promise.all([
    db.from('pl_activities').select('status, percent_complete').eq('project_id', projectId),
    db.from('pl_milestones').select('status').eq('project_id', projectId),
  ])
  const acts = activities.data ?? []
  const avgProgress = acts.length > 0
    ? acts.reduce((s, a) => s + (a.percent_complete ?? 0), 0) / acts.length
    : 0
  const statusCounts: Record<string, number> = {}
  acts.forEach(a => { const s = a.status ?? 'unknown'; statusCounts[s] = (statusCounts[s] ?? 0) + 1 })
  return {
    totalActivities: acts.length,
    avgProgress,
    openMilestones: milestones.data?.filter(m => !['completed', 'achieved'].includes(m.status ?? '')).length ?? 0,
    activitiesByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
  }
}

async function fetchSafetyData(db: Supabase, projectId: string): Promise<SafetyData> {
  const [incidents, observations] = await Promise.all([
    db.from('sf_incidents').select('severity').eq('project_id', projectId),
    db.from('sf_observations').select('status').eq('project_id', projectId),
  ])
  const incs = incidents.data ?? []
  const sevCounts: Record<string, number> = {}
  incs.forEach(i => { const s = i.severity ?? 'unknown'; sevCounts[s] = (sevCounts[s] ?? 0) + 1 })
  return {
    totalIncidents: incs.length,
    openObservations: observations.data?.filter(o => o.status === 'open').length ?? 0,
    incidentsBySeverity: Object.entries(sevCounts).map(([severity, count]) => ({ severity, count })),
  }
}

async function fetchQualityData(db: Supabase, projectId: string): Promise<QualityData> {
  const [ncr, punch, inspections] = await Promise.all([
    db.from('ql_ncr').select('status').eq('project_id', projectId),
    db.from('ql_punch').select('status').eq('project_id', projectId),
    db.from('ql_inspections').select('status').eq('project_id', projectId),
  ])
  const ncrData = ncr.data ?? []
  const punchData = punch.data ?? []
  const inspData = inspections.data ?? []
  return {
    openNcr: ncrData.filter(n => n.status === 'open').length,
    openPunch: punchData.filter(p => p.status === 'open').length,
    totalInspections: inspData.length,
    qualityItems: [
      {
        name: 'NCR',
        open: ncrData.filter(n => n.status === 'open').length,
        closed: ncrData.filter(n => n.status === 'closed').length,
      },
      {
        name: 'Punch',
        open: punchData.filter(p => p.status === 'open').length,
        closed: punchData.filter(p => p.status === 'closed').length,
      },
      {
        name: 'Inspections',
        open: inspData.filter(i => ['scheduled', 'in_progress'].includes(i.status ?? '')).length,
        closed: inspData.filter(i => i.status === 'completed').length,
      },
    ],
  }
}

// ── Page ───────────────────────────────────────────────────────────

interface Props { params: Promise<{ projectId: string }> }

export default async function ProjectDashboard({ params }: Props) {
  const { projectId } = await params

  const user = await getUser()
  const profile = await getUserProfile()
  if (!user || !profile) redirect('/login')

  const [ccRole, plRole, sfRole, qlRole] = await Promise.all([
    getUserModuleRole(projectId, 'cost_control'),
    getUserModuleRole(projectId, 'planning'),
    getUserModuleRole(projectId, 'safety'),
    getUserModuleRole(projectId, 'quality'),
  ])

  if (!ccRole && !plRole && !sfRole && !qlRole) redirect('/projects')

  const db = await createClient()

  const { data: project } = await db
    .from('projects')
    .select('name, code, status, currency, usd_rate')
    .eq('id', projectId)
    .single()

  const projectCurrency = project?.currency ?? 'USD'
  const usdRate = project?.usd_rate ?? 1

  const [ccData, plData, sfData, qlData] = await Promise.all([
    ccRole ? fetchCostData(db, projectId, projectCurrency) : null,
    plRole ? fetchPlanningData(db, projectId) : null,
    sfRole ? fetchSafetyData(db, projectId) : null,
    qlRole ? fetchQualityData(db, projectId) : null,
  ])

  const statusBadge: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    on_hold:   'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived:  'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name ?? 'Dashboard'}
            </h1>
            {project?.status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {project.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{project?.code} · Project Overview</p>
        </div>
      </div>

      {/* KPI cards + charts with USD toggle */}
      <ProjectDashboardKPIs
        ccData={ccData}
        plData={plData}
        sfData={sfData}
        qlData={qlData}
        projectCurrency={projectCurrency}
        usdRate={usdRate}
      />

    </div>
  )
}
