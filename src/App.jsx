import { useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { hasApiKey } from './api/gemini.js'

export default function App() {
  // The in-memory vector store. Each record: { text, source, embedding }.
  const [records, setRecords] = useState([])
  const keyMissing = !hasApiKey()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gemini RAG Chatbot</h1>
        <span className="tag">in-browser · client-side key</span>
      </header>

      {keyMissing && (
        <div className="banner">
          No API key found. Copy <code>.env.example</code> to <code>.env</code>, add your
          Google AI Studio key as <code>VITE_GEMINI_API_KEY</code>, then restart the dev
          server.
        </div>
      )}

      <main className="layout">
        <DocumentPanel records={records} setRecords={setRecords} disabled={keyMissing} />
        <ChatPanel records={records} disabled={keyMissing} />
      </main>
    </div>
  )
}
