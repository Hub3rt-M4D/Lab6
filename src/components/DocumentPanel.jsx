import { useRef, useState } from 'react'
import { chunkText } from '../lib/rag.js'
import { embedTexts } from '../api/gemini.js'

// Reads a File as UTF-8 text.
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export default function DocumentPanel({ records, setRecords, disabled }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Distinct source documents currently in the store.
  const sources = [...new Set(records.map((r) => r.source))]

  async function ingestFiles(files) {
    setError('')
    setBusy(true)
    try {
      const newRecords = []
      for (const file of files) {
        const text = await readFile(file)
        const chunks = chunkText(text)
        if (!chunks.length) continue
        const embeddings = await embedTexts(chunks)
        chunks.forEach((chunk, i) => {
          newRecords.push({ text: chunk, source: file.name, embedding: embeddings[i] })
        })
      }
      setRecords((prev) => [...prev, ...newRecords])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) ingestFiles(files)
  }

  function removeSource(source) {
    setRecords((prev) => prev.filter((r) => r.source !== source))
  }

  return (
    <aside className="doc-panel">
      <h2>Documents</h2>

      <label className={`upload-btn ${disabled || busy ? 'disabled' : ''}`}>
        {busy ? 'Embedding…' : 'Upload .txt / .md files'}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain"
          multiple
          onChange={handleChange}
          disabled={disabled || busy}
          hidden
        />
      </label>

      {error && <p className="error">{error}</p>}

      <p className="hint">
        {records.length
          ? `${sources.length} document(s), ${records.length} chunks indexed.`
          : 'No documents yet. Upload text files to ground the chatbot.'}
      </p>

      <ul className="doc-list">
        {sources.map((s) => {
          const count = records.filter((r) => r.source === s).length
          return (
            <li key={s}>
              <span className="doc-name" title={s}>
                {s} <em>({count})</em>
              </span>
              <button onClick={() => removeSource(s)} aria-label={`Remove ${s}`}>
                ✕
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
