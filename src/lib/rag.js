// In-browser RAG primitives: chunking, cosine similarity, and a tiny
// in-memory vector store. No server, no external vector DB.

/**
 * Split raw text into overlapping chunks of roughly `size` characters.
 * Overlap keeps sentences that straddle a boundary retrievable.
 */
export function chunkText(text, size = 1000, overlap = 150) {
  const clean = text.replace(/\r\n/g, '\n').trim()
  if (clean.length <= size) return clean ? [clean] : []

  const chunks = []
  let start = 0
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length)

    // Prefer to break on a paragraph or sentence boundary near the end.
    if (end < clean.length) {
      const slice = clean.slice(start, end)
      const breakAt = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('\n'),
      )
      if (breakAt > size * 0.5) end = start + breakAt + 1
    }

    const chunk = clean.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    if (end >= clean.length) break
    start = end - overlap
  }
  return chunks
}

export function cosineSimilarity(a, b) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Rank stored records against a query vector and return the top K.
 *
 * @param {number[]} queryVec
 * @param {Array<{text:string, source:string, embedding:number[]}>} records
 * @param {number} k
 * @returns {Array<{text:string, source:string, score:number}>}
 */
export function topK(queryVec, records, k = 4) {
  return records
    .map((r) => ({ ...r, score: cosineSimilarity(queryVec, r.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
