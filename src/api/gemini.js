// Thin client for Google's Generative Language REST API (Gemini).
//
// SECURITY NOTE: the key is read from a VITE_ env var and therefore ends up in
// the browser bundle. This is intentional for a lab/demo. For anything real,
// move these calls behind a backend proxy that holds the key.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const CHAT_MODEL = import.meta.env.VITE_GEMINI_CHAT_MODEL || 'gemini-2.5-flash'
const EMBED_MODEL = import.meta.env.VITE_GEMINI_EMBED_MODEL || 'text-embedding-004'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export function hasApiKey() {
  return Boolean(API_KEY && API_KEY !== 'your_key_here')
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message || JSON.stringify(err)
    } catch {
      detail = await res.text()
    }
    throw new Error(`Gemini API ${res.status}: ${detail}`)
  }
  return res.json()
}

/**
 * Embed a batch of text chunks. Returns an array of number[] vectors,
 * one per input string, in the same order.
 */
export async function embedTexts(texts) {
  if (!texts.length) return []
  const url = `${BASE}/models/${EMBED_MODEL}:batchEmbedContents?key=${API_KEY}`
  const body = {
    requests: texts.map((text) => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
    })),
  }
  const data = await postJson(url, body)
  return (data.embeddings || []).map((e) => e.values)
}

/**
 * Embed a single query string. Returns one number[] vector.
 */
export async function embedQuery(text) {
  const url = `${BASE}/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`
  const body = {
    model: `models/${EMBED_MODEL}`,
    content: { parts: [{ text }] },
  }
  const data = await postJson(url, body)
  return data.embedding.values
}

/**
 * Generate a chat answer grounded in the supplied context chunks.
 *
 * @param {string} question      the user's latest question
 * @param {string[]} contextChunks  retrieved document snippets
 * @param {Array<{role:string,text:string}>} history  prior turns
 * @returns {Promise<string>} the model's answer text
 */
export async function generateAnswer(question, contextChunks, history = []) {
  const url = `${BASE}/models/${CHAT_MODEL}:generateContent?key=${API_KEY}`

  const context = contextChunks.length
    ? contextChunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')
    : '(no documents uploaded yet)'

  const systemInstruction = {
    role: 'user',
    parts: [
      {
        text:
          'You are a helpful assistant answering questions strictly from the ' +
          'provided context. If the answer is not in the context, say you ' +
          "don't know based on the uploaded documents. Cite the snippet " +
          'numbers you used like [1], [2].',
      },
    ],
  }

  const contents = [
    systemInstruction,
    { role: 'model', parts: [{ text: 'Understood. I will answer from the context.' }] },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }],
    },
  ]

  const data = await postJson(url, { contents })
  const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
  return answer || '(empty response)'
}
