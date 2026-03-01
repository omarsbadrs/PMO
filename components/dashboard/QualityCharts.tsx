'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface InspectionByResult { result: string; count: number }
export interface NcrBySeverity     { severity: string; count: number }
export interface PunchByCategory   { category: string; open: number; closed: number }

interface Props {
  inspectionsByResult: InspectionByResult[]
  ncrBySeverity: NcrBySeverity[]
  punchByCategory: PunchByCategory[]
  passRate: number
  totalInspections: number
}

const STYLE = { border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', borderRadius: '8px', fontSize: '12px' }
const AXIS = { fontSize: 11, fill: '#9ca3af' }
const LABEL = { fontSize: 11, fill: '#6b7280' }

const RESULT_COLORS: Record<string, string> = {
  pass: '#16a34a', passed: '#16a34a',
  fail: '#ef4444', failed: '#ef4444',
  pending: '#9ca3af', scheduled: '#9ca3af',
  conditional: '#f59e0b',
}

const NCR_SEVERITY_COLORS: Record<string, string> = {
  critical: '#7f1d1d',
  major: '#ef4444',
  minor: '#f59e0b',
  observation: '#9ca3af',
}

function cap(s: string) {
  return s.replace(/\b\w/g, l => l.toUpperCase())
}

export default function QualityCharts({ inspectionsByResult, ncrBySeverity, punchByCategory, passRate, totalInspections }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Inspections by Result */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Inspections by Result</CardTitle>
          <p className="text-xs text-gray-400">{totalInspections} total · {Math.round(passRate)}% pass rate</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {inspectionsByResult.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No inspections recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={inspectionsByResult.map(d => ({ ...d, label: cap(d.result ?? 'Unknown') }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Inspections']} contentStyle={STYLE} />
                <Bar dataKey="count" name="Inspections" radius={[4, 4, 0, 0]} maxBarSize={55}>
                  {inspectionsByResult.map((d) => (
                    <Cell key={d.result} fill={RESULT_COLORS[d.result?.toLowerCase() ?? ''] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* NCR by Severity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">NCRs by Severity</CardTitle>
          <p className="text-xs text-gray-400">Non-conformance reports grouped by severity level</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {ncrBySeverity.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No NCRs recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={ncrBySeverity.map(d => ({ ...d, label: cap(d.severity ?? 'Unknown') }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'NCRs']} contentStyle={STYLE} />
                <Bar dataKey="count" name="NCRs" radius={[4, 4, 0, 0]} maxBarSize={55}>
                  {ncrBySeverity.map((d) => (
                    <Cell key={d.severity} fill={NCR_SEVERITY_COLORS[d.severity?.toLowerCase() ?? ''] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Punch by Category */}
      {punchByCategory.length > 0 && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Punch List by Category</CardTitle>
            <p className="text-xs text-gray-400">Open vs closed punch items per category</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={punchByCategory.map(d => ({ ...d, label: cap(d.category ?? 'Other') }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="open"   name="Open"   fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="closed" name="Closed" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
