'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flag } from 'lucide-react'

export interface ActivityByStatus { status: string; count: number }
export interface MilestoneItem {
  name: string
  planned_date: string | null
  status: string
  is_key_milestone: boolean
}

interface Props {
  activitiesByStatus: ActivityByStatus[]
  upcomingMilestones: MilestoneItem[]
  totalActivities: number
  avgProgress: number
}

const STYLE = { border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', borderRadius: '8px', fontSize: '12px' }
const AXIS = { fontSize: 11, fill: '#9ca3af' }
const LABEL = { fontSize: 11, fill: '#6b7280' }

const STATUS_COLORS: Record<string, string> = {
  completed: '#16a34a',
  complete: '#16a34a',
  in_progress: '#2563eb',
  not_started: '#9ca3af',
  delayed: '#ef4444',
  on_hold: '#f59e0b',
}
const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  complete: 'Completed',
  delayed: 'Delayed',
  on_hold: 'On Hold',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlanningCharts({ activitiesByStatus, upcomingMilestones, totalActivities, avgProgress }: Props) {
  const completed = activitiesByStatus.find(a => a.status === 'completed' || a.status === 'complete')?.count ?? 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Activities by Status */}
      {activitiesByStatus.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Activities by Status</CardTitle>
            <p className="text-xs text-gray-400">{completed} of {totalActivities} complete · {Math.round(avgProgress)}% avg progress</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={activitiesByStatus.map(d => ({ ...d, label: STATUS_LABEL[d.status] ?? d.status }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Activities']} contentStyle={STYLE} />
                <Bar dataKey="count" name="Activities" radius={[4, 4, 0, 0]} maxBarSize={55}>
                  {activitiesByStatus.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress Bar */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Schedule Completion</CardTitle>
          <p className="text-xs text-gray-400">Overall progress across all activities</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-500">Overall Progress</span>
              <span className="text-xs font-semibold text-gray-700">{Math.round(avgProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, avgProgress)}%`,
                  background: avgProgress >= 80 ? '#16a34a' : avgProgress >= 50 ? '#2563eb' : '#f59e0b',
                }}
              />
            </div>
          </div>

          {/* Mini status bars */}
          {activitiesByStatus.map((s) => (
            <div key={s.status}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">{STATUS_LABEL[s.status] ?? s.status}</span>
                <span className="text-xs font-medium text-gray-600">{s.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: totalActivities > 0 ? `${(s.count / totalActivities) * 100}%` : '0%',
                    backgroundColor: STATUS_COLORS[s.status] ?? '#9ca3af',
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Upcoming Milestones</CardTitle>
            <p className="text-xs text-gray-400">Pending and in-progress milestones ordered by planned date</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="divide-y divide-gray-100">
              {upcomingMilestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.is_key_milestone ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Flag className={`w-3.5 h-3.5 ${m.is_key_milestone ? 'text-orange-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.planned_date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700' :
                    m.status === 'delayed'   ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
