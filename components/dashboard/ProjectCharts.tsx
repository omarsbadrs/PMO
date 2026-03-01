'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import type { CostData, PlanningData, SafetyData, QualityData } from '@/types/dashboard'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', SAR: '﷼', EGP: 'E£',
}

function makeMoney(currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + ' '
  return (v: number) =>
    v >= 1_000_000 ? `${sym}${(v / 1_000_000).toFixed(1)}M` : `${sym}${(v / 1000).toFixed(0)}k`
}

interface Props {
  ccData: CostData | null
  plData: PlanningData | null
  sfData: SafetyData | null
  qlData: QualityData | null
  currency?: string
}

const CHART_STYLE = {
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  borderRadius: '8px',
  fontSize: '12px',
}

const AXIS_TICK = { fontSize: 11, fill: '#9ca3af' }
const LABEL_TICK = { fontSize: 12, fill: '#6b7280' }

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  complete: 'Completed',
  delayed: 'Delayed',
  on_hold: 'On Hold',
  pending: 'Pending',
}

const STATUS_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#9ca3af']

const SEVERITY_COLORS: Record<string, string> = {
  near_miss: '#f59e0b',
  first_aid: '#fb923c',
  medical_treatment: '#f97316',
  lti: '#ef4444',
  fatality: '#7f1d1d',
  unknown: '#9ca3af',
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  )
}

export default function ProjectCharts({ ccData, plData, sfData, qlData, currency = 'USD' }: Props) {
  const money = makeMoney(currency)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* ── Cost Overview ──────────────────────────────── */}
      {ccData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Cost Overview</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Budget · Actuals · Commitments</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { name: 'Budget',       value: ccData.totalBudget },
                  { name: 'Actuals',      value: ccData.totalActuals },
                  { name: 'Commitments',  value: ccData.totalCommitments },
                ]}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={LABEL_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={money}
                />
                <Tooltip
                  formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency), '']}
                  contentStyle={CHART_STYLE}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  <Cell fill="#2563eb" />
                  <Cell fill="#16a34a" />
                  <Cell fill="#ea580c" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Activities by Status ───────────────────────── */}
      {plData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Schedule Progress</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{plData.totalActivities} activities · {Math.round(plData.avgProgress)}% avg completion</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {plData.activitiesByStatus.length === 0 ? (
              <EmptyState message="No activities recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={plData.activitiesByStatus.map(d => ({
                    label: STATUS_LABEL[d.status] ?? d.status,
                    count: d.count,
                    _status: d.status,
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={LABEL_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number | undefined) => [v ?? 0, 'Activities']}
                    contentStyle={CHART_STYLE}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {plData.activitiesByStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Incidents by Severity ──────────────────────── */}
      {sfData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Safety Incidents</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{sfData.totalIncidents} total · {sfData.openObservations} open observations</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {sfData.incidentsBySeverity.length === 0 ? (
              <EmptyState message="No incidents recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={sfData.incidentsBySeverity.map(d => ({
                    label: d.severity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    count: d.count,
                    _sev: d.severity,
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number | undefined) => [v ?? 0, 'Incidents']}
                    contentStyle={CHART_STYLE}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {sfData.incidentsBySeverity.map((d) => (
                      <Cell key={d.severity} fill={SEVERITY_COLORS[d.severity] ?? '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Quality — Open vs Closed ───────────────────── */}
      {qlData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Quality Status</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{qlData.openNcr} open NCRs · {qlData.openPunch} open punch items</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={qlData.qualityItems}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={LABEL_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="open"   name="Open"   fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="closed" name="Closed" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
