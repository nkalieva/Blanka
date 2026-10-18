import fs from 'fs'
import path from 'path'

export type Chunk = {
  chunk_id: string
  source: string
  heading: string
  content: string
  chunk_index: number
}

function splitMarkdownIntoChunks(filename: string, markdown: string): Chunk[] {
  const chunks: Chunk[] = []
  const sections = markdown.split(/\n## /)

  sections.forEach((section, i) => {
    const lines = section.trim().split('\n')
    const heading = lines[0].replace(/^#+\s*/, '').trim()
    const body = lines.slice(1).join('\n').trim()
    if (!body) return
    chunks.push({
      chunk_id: `${filename}::${i}`,
      source: filename,
      heading,
      content: `${heading}\n\n${body}`,
      chunk_index: i,
    })
  })

  return chunks
}

export function getAllChunks(): Chunk[] {
  const knowledgeDir = path.join(process.cwd(), 'knowledge')
  const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'))
  return files.flatMap(filename => {
    const content = fs.readFileSync(path.join(knowledgeDir, filename), 'utf-8')
    return splitMarkdownIntoChunks(filename, content)
  })
}
