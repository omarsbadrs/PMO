'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

export interface BudgetByDiscipline { discipline: string; budget: number; actuals: number }
export interface CommitmentByStatus { status: string; count: number; amount: number }
export interface ActualByVendor { vendor: string; amount: number }

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', SAR: '﷼', EGP: 'E£',
}

interface Props {
  budgetByDiscipline: BudgetByDiscipline[]
  commitmentsByStatus: CommitmentByStatus[]
  actualsByVendor: ActualByVendor[]
  currency?: string
}

const STYLE = {
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  borderRadius: '8px',
  fontSize: '12px',
}
const AXIS = { fontSize: 11, fill: '#9ca3af' }
const LABEL = { fontSize: 11, fill: '#6b7280' }
const STATUS_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#f59e0b', '#9ca3af']

function makeMoney(currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + ' '
  return (v: number | undefined) => {
    const n = v ?? 0
    return n >= 1_000_000 ? `${sym}${(n / 1_000_000).toFixed(1)}M` : `${sym}${(n / 1000).toFixed(0)}k`
  }
}

export default function CostControlCharts({ budgetByDiscipline, commitmentsByStatus, actualsByVendor, currency = 'USD' }: Props) {
  const money = makeMoney(currency)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Budget vs Actuals by Discipline */}
      {budgetByDiscipline.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Budget vs Actuals by Discipline</CardTitle>
            <p className="text-xs text-gray-400">Approved budget compared to actual spend per discipline</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetByDiscipline} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="discipline" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={money} />
                <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency), '']} contentStyle={STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="budget"  name="Budget"  fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="actuals" name="Actuals" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Actuals by Vendor / Category */}
      {actualsByVendor.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Actual Cost by Vendor</CardTitle>
            <p className="text-xs text-gray-400">Top vendors by total invoiced amount</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={actualsByVendor} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={money} />
                <YAxis type="category" dataKey="vendor" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency), 'Amount']} contentStyle={STYLE} />
                <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {actualsByVendor.map((_, i) => (
                    <Cell key={i} fill={['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* POs by Status */}
      {commitmentsByStatus.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Purchase Orders by Status</CardTitle>
            <p className="text-xs text-gray-400">Number of POs per approval status</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={commitmentsByStatus} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="status" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'POs']} contentStyle={STYLE} />
                <Bar dataKey="count" name="POs" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {commitmentsByStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* PO Amount by Status */}
      {commitmentsByStatus.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Committed Amount by Status</CardTitle>
            <p className="text-xs text-gray-400">Total PO value per approval status</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={commitmentsByStatus} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="status" tick={LABEL} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={money} />
                <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency), 'Amount']} contentStyle={STYLE} />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {commitmentsByStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
