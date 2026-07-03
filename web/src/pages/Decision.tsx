import { useState, useEffect, useRef, FormEvent } from 'react'
import { decisionAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Message { role: 'user' | 'ai'; text: string }

export default function Decision() {
  const { activeGoal } = useAuth()
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await decisionAPI.history()
        const hist: Message[] = (res.data ?? []).flatMap((d: { question: string; answer: string }) => [
          { role: 'user', text: d.question },
          { role: 'ai',   text: d.answer },
        ])
        setMessages(hist)
      } catch { /* empty */ }
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
      setMessages(prev => [...prev, { role: 'ai', text: "I couldn't process that request. Please try again." }])
    } finally { setSending(false) }
  }

  return (
    <div
      className="animate-in"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}
    >
      {/* Header */}
      <div style={{
        padding: 'calc(var(--safe-top) + 20px) 22px 14px',
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        <p className="t-overline">AI Coach</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginTop: 4 }}>Ask anything</h1>
        {activeGoal && (
          <p className="t-sm" style={{ marginTop: 4, color: 'var(--t3)', lineHeight: 1.4 }}>
            Focused on: {activeGoal.title.length > 48
              ? activeGoal.title.slice(0, 48) + '…'
              : activeGoal.title}
          </p>
        )}
      </div>

      {/* Chat area */}
      <div className="chat-scroll">
        {loadingHistory ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : messages.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 32 }}>
            <div className="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 16 }}>Start a conversation</p>
            <p className="t-sm t-muted" style={{ lineHeight: 1.5 }}>
              Ask your AI coach anything about your goal — strategy, next steps, obstacles, priorities.
            </p>
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
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', textAlign: 'center' }}>
          <p className="t-sm t-muted">Create a goal first to use the AI coach.</p>
        </div>
      ) : (
        <form className="chat-input-bar" onSubmit={send}>
          <input
            className="input"
            style={{ height: 42, flex: 1, fontSize: 14 }}
            placeholder="Ask your coach…"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
          />
          <button className="send-btn" type="submit" disabled={sending || !input.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}
