import { useState, useEffect, useRef, FormEvent } from 'react'
import { decisionAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Message { role: 'user' | 'ai'; text: string }

export default function Decision() {
  const { activeGoal } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load history
  useEffect(() => {
    ;(async () => {
      try {
        const res = await decisionAPI.history()
        const hist: Message[] = (res.data ?? []).flatMap((d: { question: string; answer: string }) => [
          { role: 'user', text: d.question },
          { role: 'ai', text: d.answer },
        ])
        setMessages(hist)
      } catch { /* empty history is fine */ }
      finally { setLoadingHistory(false) }
    })()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeGoal || sending) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setSending(true)
    try {
      const res = await decisionAPI.ask(activeGoal.id, q)
      setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that. Try again." }])
    } finally { setSending(false) }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="text-xs text-accent upper">AI Decision Coach</p>
        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>Ask Anything</p>
        <p className="text-sm text-muted" style={{ marginTop: 2 }}>About your goal, strategy, next steps…</p>
      </div>

      {/* Chat area */}
      <div className="chat-scroll">
        {loadingHistory ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : messages.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 32 }}>
            <span className="empty-emoji">🤖</span>
            <p style={{ fontWeight: 700, fontSize: 18 }}>Ask your AI coach</p>
            <p className="text-sm text-muted">Type a question below to get personalised advice about your goal.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`bubble bubble-${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.text}
            </div>
          ))
        )}

        {sending && (
          <div className="bubble bubble-ai">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!activeGoal ? (
        <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <p className="text-sm text-muted">Create a goal first to use the AI coach.</p>
        </div>
      ) : (
        <form className="chat-input-row" onSubmit={send}>
          <input
            className="input"
            style={{ height: 44, flex: 1 }}
            placeholder="Ask your coach…"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
          />
          <button className="send-btn" type="submit" disabled={sending || !input.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}
