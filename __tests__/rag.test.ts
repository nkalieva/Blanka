/**
 * @jest-environment node
 */
import { getAllChunks } from '../lib/rag/chunker'

describe('RAG chunker', () => {
  it('produces at least one chunk per document', () => {
    const chunks = getAllChunks()
    expect(chunks.length).toBeGreaterThan(0)
  })

  it('chunks come from multiple source files', () => {
    const chunks = getAllChunks()
    const sources = [...new Set(chunks.map(c => c.source))]
    expect(sources.length).toBeGreaterThanOrEqual(2)
  })

  it('every chunk has required metadata fields', () => {
    const chunks = getAllChunks()
    for (const chunk of chunks) {
      expect(chunk.chunk_id).toBeTruthy()
      expect(chunk.source).toBeTruthy()
      expect(chunk.heading).toBeTruthy()
      expect(chunk.content).toBeTruthy()
      expect(typeof chunk.chunk_index).toBe('number')
    }
  })

  it('chunk_id includes the source filename', () => {
    const chunks = getAllChunks()
    for (const chunk of chunks) {
      expect(chunk.chunk_id).toContain(chunk.source)
    }
  })

  it('heading content appears inside chunk content', () => {
    const chunks = getAllChunks()
    for (const chunk of chunks) {
      expect(chunk.content).toContain(chunk.heading)
    }
  })

  it('chunk_index is unique within same source', () => {
    const chunks = getAllChunks()
    for (const source of [...new Set(chunks.map(c => c.source))]) {
      const sourceChunks = chunks.filter(c => c.source === source)
      const indices = sourceChunks.map(c => c.chunk_index)
      const unique = new Set(indices)
      expect(unique.size).toBe(indices.length)
    }
  })

  it('worker handbook chunks include policy topics', () => {
    const chunks = getAllChunks()
    const handbookChunks = chunks.filter(c => c.source === 'worker-handbook.md')
    const headings = handbookChunks.map(c => c.heading)
    expect(headings.some(h => h.toLowerCase().includes('check'))).toBe(true)
    expect(headings.some(h => h.toLowerCase().includes('safety') || h.toLowerCase().includes('cancel'))).toBe(true)
  })

  it('faq chunks include Q&A style content', () => {
    const chunks = getAllChunks()
    const faqChunks = chunks.filter(c => c.source === 'service-faq.md')
    expect(faqChunks.length).toBeGreaterThan(0)
    const allText = faqChunks.map(c => c.content).join(' ')
    expect(allText.toLowerCase()).toContain('blanka')
  })

  it('knowledge base has at least 10 total knowledge points', () => {
    const chunks = getAllChunks()
    expect(chunks.length).toBeGreaterThanOrEqual(10)
  })
})
