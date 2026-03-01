'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import DataTable, { Column, StatusBadge } from '@/components/shared/DataTable'
import { formatDate } from '@/lib/utils/format'
import type { Project } from '@/types/app'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', SAR: '﷼', EGP: 'E£', GBP: '£',
}

const columns: Column<Project>[] = [
  { key: 'code',     header: 'Code',         className: 'w-28 font-mono text-sm' },
  { key: 'name',     header: 'Project Name' },
  {
    key: 'currency',
    header: 'Currency',
    className: 'w-28',
    render: (row) => {
      const cur = row.currency ?? 'USD'
      return (
        <span className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium">
          <span className="text-gray-400">{CURRENCY_SYMBOLS[cur] ?? ''}</span>
          {cur}
        </span>
      )
    },
  },
  {
    key: 'status',
    header: 'Status',
    className: 'w-28',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'start_date',
    header: 'Start',
    className: 'w-32',
    render: (row) => <span className="text-sm text-gray-600">{formatDate(row.start_date)}</span>,
  },
  {
    key: 'end_date',
    header: 'End',
    className: 'w-32',
    render: (row) => <span className="text-sm text-gray-600">{formatDate(row.end_date)}</span>,
  },
  {
    key: 'id',
    header: '',
    className: 'w-20 text-right',
    render: (row) => (
      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
        <Link href={`/admin/projects/${row.id}`}>
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Edit
        </Link>
      </Button>
    ),
  },
]

export default function AdminProjectsTable({ data }: { data: Project[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      total={data.length}
      emptyMessage="No projects yet."
    />
  )
}
