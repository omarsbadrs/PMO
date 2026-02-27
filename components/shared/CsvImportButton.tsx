'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export interface ImportColumn {
  key: string
  label: string
  required?: boolean
}

interface Props {
  table: string
  projectId: string
  importColumns: ImportColumn[]
}

type Step = 'upload' | 'map' | 'importing' | 'done'

export default function CsvImportButton({ table, projectId, importColumns }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function normalize(s: string) {
    return s.toLowerCase().replace(/[\s_\-()%#]/g, '')
  }

  function autoMap(headers: string[]): Record<string, string> {
    const m: Record<string, string> = {}
    for (const col of importColumns) {
      const match = headers.find(
        (h) => normalize(h) === normalize(col.key) || normalize(h) === normalize(col.label)
      )
      if (match) m[col.key] = match
    }
    return m
  }

  async function handleFile(file: File) {
    setParseError('')
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array', raw: false, dateNF: 'yyyy-mm-dd' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: '',
      })
      if (!rows.length) {
        setParseError('File is empty or has no data rows.')
        return
      }
      const headers = Object.keys(rows[0])
      setCsvHeaders(headers)
      setCsvRows(rows as Record<string, string>[])
      setMapping(autoMap(headers))
      setStep('map')
    } catch {
      setParseError('Could not parse file. Please use a valid CSV or Excel file.')
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([importColumns.map((c) => c.label)])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Import Template')
    XLSX.writeFile(wb, `${table}_template.xlsx`)
  }

  async function handleImport() {
    setStep('importing')
    const rows = csvRows
      .map((csvRow) => {
        const row: Record<string, unknown> = {}
        for (const col of importColumns) {
          const csvKey = mapping[col.key]
          if (csvKey && csvRow[csvKey] !== undefined && csvRow[csvKey] !== '') {
            row[col.key] = csvRow[csvKey]
          }
        }
        return row
      })
      .filter((row) => Object.keys(row).length > 0)

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, projectId, rows }),
    })
    const data = await res.json()
    setResult(data)
    setStep('done')
    if (data.inserted > 0) router.refresh()
  }

  function reset() {
    setStep('upload')
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setResult(null)
    setParseError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const missingRequired = importColumns
    .filter((c) => c.required && !mapping[c.key])
    .map((c) => c.label)

  const previewRow = csvRows[0] ?? {}

  return (
    <>
      <Button variant="outline" onClick={() => { reset(); setOpen(true) }}>
        <Upload className="w-4 h-4 mr-2" /> Import CSV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) { reset(); setOpen(false) } else setOpen(true)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import from CSV / Excel</DialogTitle>
            <DialogDescription>
              Upload a .csv or .xlsx file to bulk-import records.{' '}
              <button onClick={downloadTemplate} className="text-blue-600 underline text-sm">
                Download template
              </button>
            </DialogDescription>
          </DialogHeader>

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Click to browse or drag & drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV or Excel (.xlsx, .xls) — first sheet only</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {parseError && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {parseError}
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: Column mapping ── */}
          {step === 'map' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Found <strong>{csvRows.length}</strong> rows. Map your file columns to the database fields below.
              </p>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 w-44">DB Field</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Your Column</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 w-48">Preview (row 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importColumns.map((col) => (
                      <tr key={col.key} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">
                          {col.label}
                          {col.required && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={mapping[col.key] ?? ''}
                            onChange={(e) =>
                              setMapping((m) => ({ ...m, [col.key]: e.target.value }))
                            }
                          >
                            <option value="">— skip —</option>
                            {csvHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate">
                          {mapping[col.key] ? (previewRow[mapping[col.key]] || '—') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {missingRequired.length > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  Required fields not mapped: <strong>{missingRequired.join(', ')}</strong>
                </p>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={reset}>
                  <X className="w-4 h-4 mr-2" /> Change file
                </Button>
                <Button onClick={handleImport} disabled={missingRequired.length > 0}>
                  Import {csvRows.length} rows
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Importing ── */}
          {step === 'importing' && (
            <div className="py-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-sm text-gray-600">Importing rows…</p>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && result && (
            <div className="space-y-4 py-4">
              {result.inserted > 0 && (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded p-4">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Successfully imported {result.inserted} record{result.inserted !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-4 space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {result.errors.length} error(s):
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="ml-6">{e}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={reset}>
                  Import more
                </Button>
                <Button onClick={() => { setOpen(false); reset() }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
