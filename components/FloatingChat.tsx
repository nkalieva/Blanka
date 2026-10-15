'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

type Reply = { reply: string; type: 'urgent' | 'question' | 'update' }

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? ''

export function FloatingChat({ workerName }: { workerName: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState<Reply | null>(null)

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    setReply(null)
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), worker_name: workerName }),
      })
      const data: Reply = await res.json()
      setReply(data)
      setMessage('')
    } catch {
      setReply({ reply: 'Could not reach the server. Please try again.', type: 'update' })
    }
    setSending(false)
  }

  const replyColor =
    reply?.type === 'urgent' ? 'bg-red-50 border-red-200 text-red-800' :
    reply?.type === 'question' ? 'bg-blue-50 border-blue-200 text-blue-800' :
    'bg-green-50 border-green-200 text-green-800'

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-[#e0e8e1] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a2821]">
            <span className="text-white font-semibold text-sm">Message Manager</span>
            <button onClick={() => { setOpen(false); setReply(null) }} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {reply && (
              <div className={`text-sm rounded-xl p-3 border ${replyColor}`}>
                {reply.reply}
              </div>
            )}
            <textarea
              className="w-full text-sm border border-[#e0e8e1] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#5a7a5c] text-[#1a2821] placeholder-[#b0bcb2]"
              rows={3}
              placeholder="Type your message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSend() }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#1a2821] text-white text-sm py-2 rounded-xl hover:bg-[#2a3831] transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 bg-[#1a2821] text-white rounded-full w-13 h-13 flex items-center justify-center shadow-lg hover:bg-[#2a3831] transition-colors"
        style={{ width: 52, height: 52 }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
