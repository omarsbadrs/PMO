// SERVER-SIDE ONLY — never import in client components

export interface ParsedPage {
  pageNumber: number
  text: string
  type: 'pdf' | 'docx' | 'xlsx'
  sheetName?: string
}

export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedPage[]> {
  if (mimeType === 'application/pdf') {
    return parsePdf(buffer)
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return parseDocx(buffer)
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return parseXlsx(buffer)
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

async function parsePdf(buffer: Buffer): Promise<ParsedPage[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfModule = await import('pdf-parse') as any
  const pdfParse = pdfModule.default ?? pdfModule
  const data = await pdfParse(buffer)

  // Split by page markers if possible, otherwise treat as one block
  const pages = data.text.split(/\f/).filter((p: string) => p.trim())
  return pages.map((text: string, i: number) => ({
    pageNumber: i + 1,
    text: text.trim(),
    type: 'pdf' as const,
  }))
}

async function parseDocx(buffer: Buffer): Promise<ParsedPage[]> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  const paragraphs = result.value.split(/\n{2,}/).filter((p) => p.trim())

  // Group paragraphs into ~1000-char blocks simulating "pages"
  const pages: ParsedPage[] = []
  let current = ''
  let pageNum = 1

  for (const para of paragraphs) {
    if (current.length + para.length > 3000 && current.length > 0) {
      pages.push({ pageNumber: pageNum++, text: current.trim(), type: 'docx' })
      current = ''
    }
    current += para + '\n\n'
  }
  if (current.trim()) {
    pages.push({ pageNumber: pageNum, text: current.trim(), type: 'docx' })
  }

  return pages
}

async function parseXlsx(buffer: Buffer): Promise<ParsedPage[]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const pages: ParsedPage[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    if (rows.length === 0) continue

    // Group rows into blocks of 50
    const ROWS_PER_CHUNK = 50
    for (let i = 0; i < rows.length; i += ROWS_PER_CHUNK) {
      const chunk = rows.slice(i, i + ROWS_PER_CHUNK)
      const text = chunk
        .map((row) =>
          Object.entries(row)
            .filter(([, v]) => String(v).trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')
        )
        .join('\n')

      pages.push({
        pageNumber: Math.floor(i / ROWS_PER_CHUNK) + 1,
        text,
        type: 'xlsx',
        sheetName,
      })
    }
  }

  return pages
}
