import { NextRequest, NextResponse } from 'next/server'
import { ragDeterministicChain } from '@/lib/rag/rag-deterministic-chain'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const question: string = body?.question?.trim()

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  const result = await ragDeterministicChain(question)
  return NextResponse.json(result)
}
