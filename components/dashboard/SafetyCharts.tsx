'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface IncidentBySeverity { severity: string; count: number }
export interface ObservationByType { type: string; open: number; closed: number }

interface Props {
  incidentsBySeverity: IncidentBySeverity[]
  observationsByType: ObservationByType[]
  openIncidents: number
  closedIncidents: number
}

const STYLE = { border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', borderRadius: '8px', fontSize: '12px' }
const AXIS = { fontSize: 11, fill: '#9ca3af' }
const LABEL = { fontSize: 11, fill: '#6b7280' }

const SEVERITY_COLORS: Record<string, string> = {
  near_miss:          '#f59e0b',
  first_aid:          '#fb923c',
  medical_treatment:  '#f97316',
  lti:                '#ef4444',
  fatality:           '#7f1d1d',
}

function severityLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function SafetyCharts({ incidentsBySeverity, observationsByType, openIncidents, closedIncidents }: Props) {
  const total = openIncidents + closedIncidents
  const closureRate = total > 0 ? Math.round((closedIncidents / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Incidents by Severity */}
      {incidentsBySeverity.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Incidents by Severity</CardTitle>
            <p className="text-xs text-gray-400">Total incident count per severity classification</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={incidentsBySeverity.map(d => ({ ...d, label: severityLabel(d.severity) }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Incidents']} contentStyle={STYLE} />
                <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]} maxBarSize={55}>
                  {incidentsBySeverity.map((d) => (
                    <Cell key={d.severity} fill={SEVERITY_COLORS[d.severity] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Incidents by Severity</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 h-[220px] flex items-center justify-center text-sm text-gray-400">
            No incidents recorded
          </CardContent>
        </Card>
      )}

      {/* Incident Closure Rate */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Incident Status</CardTitle>
          <p className="text-xs text-gray-400">Open vs closed incidents</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-500">Closure Rate</span>
              <span className="text-xs font-semibold text-gray-700">{closureRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${closureRate}%`,
                  background: closureRate >= 80 ? '#16a34a' : closureRate >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{openIncidents}</p>
              <p className="text-xs text-red-500 mt-0.5">Open</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{closedIncidents}</p>
              <p className="text-xs text-green-500 mt-0.5">Closed</p>
            </div>
          </div>

          {/* Severity legend */}
          <div className="space-y-1.5">
            {incidentsBySeverity.map((d) => (
              <div key={d.severity} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: SEVERITY_COLORS[d.severity] ?? '#9ca3af' }} />
                <span className="text-xs text-gray-500 flex-1">{severityLabel(d.severity)}</span>
                <span className="text-xs font-medium text-gray-700">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observations by Type */}
      {observationsByType.length > 0 && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Safety Observations by Type</CardTitle>
            <p className="text-xs text-gray-400">Open vs closed observations per observation type</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={observationsByType} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="type" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="open"   name="Open"   fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={35} />
                <Bar dataKey="closed" name="Closed" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
