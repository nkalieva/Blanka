'use client'

import { useState } from 'react'
import { Send, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useLang } from '@/lib/i18n'

type Source = { source: string; heading: string; chunk_id: string }
type RagResponse = { answer: string; sources: Source[] }

export function RagChat() {
  const { t } = useLang()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<RagResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSources, setShowSources] = useState(false)

  async function handleAsk(q?: string) {
    const text = (q ?? question).trim()
    if (!text || loading) return

    setLoading(true)
    setResult(null)
    setShowSources(false)

    if (q) setQuestion(q)

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data: RagResponse = await res.json()
      setResult(data)
    } catch {
      setResult({ answer: 'Could not reach the server. Please try again.', sources: [] })
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e0e8e1] overflow-hidden">
      <div className="px-6 py-4 bg-[#1a2821] flex items-center gap-3">
        <BookOpen size={18} className="text-white/70" />
        <div>
          <h2 className="text-white font-semibold text-sm">{t.ragTitle}</h2>
          <p className="text-white/50 text-xs">{t.ragSubtitle}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Sample questions */}
        <div>
          <p className="text-xs font-medium text-[#6b7b6e] uppercase tracking-wider mb-3">{t.ragTryQuestion}</p>
          <div className="flex flex-wrap gap-2">
            {t.ragQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#e0e8e1] text-[#3a5a3c] hover:bg-[#f0f5f1] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
            placeholder={t.ragPlaceholder}
            className="flex-1 text-sm border border-[#e0e8e1] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#5a7a5c] text-[#1a2821] placeholder-[#b0bcb2]"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 bg-[#1a2821] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#2a3831] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="bg-[#f8faf8] rounded-xl p-4 border border-[#e0e8e1]">
              <p className="text-sm text-[#1a2821] leading-relaxed">{result.answer}</p>
            </div>

            {result.sources.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSources(s => !s)}
                  className="flex items-center gap-1 text-xs text-[#5a7a5c] hover:text-[#1a2821] transition-colors"
                >
                  {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {result.sources.length} {t.ragSourcesUsed}
                </button>

                {showSources && (
                  <div className="mt-2 space-y-1.5">
                    {result.sources.map(s => (
                      <div key={s.chunk_id} className="flex items-center gap-2 text-xs text-[#6b7b6e] bg-[#f0f5f1] rounded-lg px-3 py-2">
                        <span className="font-mono text-[#5a7a5c]">{s.source}</span>
                        <span className="text-[#b0bcb2]">›</span>
                        <span>{s.heading}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
