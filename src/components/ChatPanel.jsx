import { useEffect, useRef, useState } from 'react'
import { embedQuery, generateAnswer } from '../api/gemini.js'
import { topK } from '../lib/rag.js'

export default function ChatPanel({ records, disabled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, busy])

  async function send() {
    const question = input.trim()
    if (!question || busy) return

    setInput('')
    const history = messages
    setMessages((m) => [...m, { role: 'user', text: question }])
    setBusy(true)

    try {
      let contextChunks = []
      let sources = []
      if (records.length) {
        const qVec = await embedQuery(question)
        const hits = topK(qVec, records, 4)
        contextChunks = hits.map((h) => h.text)
        sources = [...new Set(hits.map((h) => h.source))]
      }
      const answer = await generateAnswer(question, contextChunks, history)
      setMessages((m) => [...m, { role: 'assistant', text: answer, sources }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `⚠️ ${e.message}`, error: true }])
    } finally {
      setBusy(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section className="chat-panel">
      <div className="messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Ask a question. Answers are grounded in your uploaded documents.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role} ${m.error ? 'error' : ''}`}>
            <div className="bubble">
              {m.text}
              {m.sources?.length > 0 && (
                <div className="sources">Sources: {m.sources.join(', ')}</div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="message assistant">
            <div className="bubble typing">Thinking…</div>
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={disabled ? 'Set your API key first…' : 'Ask a question…'}
          disabled={disabled || busy}
          rows={2}
        />
        <button onClick={send} disabled={disabled || busy || !input.trim()}>
          Send
        </button>
      </div>
    </section>
  )
}
