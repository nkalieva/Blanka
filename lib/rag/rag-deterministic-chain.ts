import { getAllChunks, type Chunk } from './chunker'

// TF-IDF keyword retrieval — deterministic, no embeddings API needed
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function tfidfScore(query: string, chunk: Chunk): number {
  const queryTokens = tokenize(query)
  const docTokens = tokenize(chunk.content)
  const docLength = docTokens.length

  let score = 0
  for (const token of queryTokens) {
    const tf = docTokens.filter(t => t === token).length / docLength
    score += tf
  }
  return score
}

const MIN_SCORE_THRESHOLD = 0.003

function retrieveChunks(query: string, topK = 3): { chunks: Chunk[]; topScore: number } {
  const allChunks = getAllChunks()
  const scored = allChunks.map(chunk => ({ chunk, score: tfidfScore(query, chunk) }))
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, topK)
  return { chunks: top.map(s => s.chunk), topScore: top[0]?.score ?? 0 }
}

function buildPrompt(question: string, context: Chunk[]): string {
  const contextText = context
    .map(c => `[Source: ${c.source}, Section: ${c.heading}]\n${c.content}`)
    .join('\n\n---\n\n')

  return `You are a helpful assistant for Blanka, a professional cleaning service company. Answer the worker's question using only the information provided in the context below. If the answer is not in the context, say "I don't have information about that in the handbook."

Context:
${contextText}

Question: ${question}

Answer:`
}

export type RagResult = {
  answer: string
  sources: { source: string; heading: string; chunk_id: string }[]
}

export async function ragDeterministicChain(question: string): Promise<RagResult> {
  const { chunks: topChunks, topScore } = retrieveChunks(question)

  if (topScore < MIN_SCORE_THRESHOLD) {
    return {
      answer: "I don't have information about that in the Blanka handbook.",
      sources: [],
    }
  }

  const prompt = buildPrompt(question, topChunks)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallback = topChunks[0]
    return {
      answer: `Based on the handbook: ${fallback.content}`,
      sources: topChunks.map(c => ({ source: c.source, heading: c.heading, chunk_id: c.chunk_id })),
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0, // deterministic — same question always gets same answer
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const answer = data.choices?.[0]?.message?.content ?? "I couldn't generate an answer."

  return {
    answer,
    sources: topChunks.map(c => ({ source: c.source, heading: c.heading, chunk_id: c.chunk_id })),
  }
}
