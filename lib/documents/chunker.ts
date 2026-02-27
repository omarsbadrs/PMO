import type { ParsedPage } from './parser'

export interface Chunk {
  chunkIndex: number
  text: string
  metadata: {
    pageNumber: number
    type: string
    sheetName?: string
    charStart: number
    charEnd: number
  }
}

const TARGET_TOKENS = 1000
const OVERLAP_TOKENS = 200
// Rough approximation: 1 token ≈ 4 chars
const CHARS_PER_TOKEN = 4
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN

export function chunkPages(pages: ParsedPage[]): Chunk[] {
  const chunks: Chunk[] = []
  let chunkIndex = 0

  for (const page of pages) {
    const text = page.text.trim()
    if (!text) continue

    if (text.length <= TARGET_CHARS) {
      // Small page — one chunk
      chunks.push({
        chunkIndex: chunkIndex++,
        text,
        metadata: {
          pageNumber: page.pageNumber,
          type: page.type,
          sheetName: page.sheetName,
          charStart: 0,
          charEnd: text.length,
        },
      })
    } else {
      // Large page — split with overlap
      let start = 0
      while (start < text.length) {
        const end = Math.min(start + TARGET_CHARS, text.length)
        const chunkText = text.slice(start, end).trim()
        if (chunkText) {
          chunks.push({
            chunkIndex: chunkIndex++,
            text: chunkText,
            metadata: {
              pageNumber: page.pageNumber,
              type: page.type,
              sheetName: page.sheetName,
              charStart: start,
              charEnd: end,
            },
          })
        }
        if (end >= text.length) break
        start = end - OVERLAP_CHARS
      }
    }
  }

  return chunks
}
