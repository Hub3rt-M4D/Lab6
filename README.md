# Gemini RAG Chatbot

A React (Vite) app that runs a Retrieval-Augmented Generation chatbot entirely
in the browser, backed by Google's Gemini API. Upload text documents, and the
chatbot answers questions grounded in their content.

## How it works

```
Upload .txt/.md  ──►  chunk  ──►  Gemini embeddings  ──►  in-memory vector store
                                                                  │
Question  ──►  embed query  ──►  cosine top-K  ──►  Gemini chat  ─┘  ──►  Answer
```

- **Chunking & retrieval** — `src/lib/rag.js` (overlapping chunks, cosine similarity, top-K).
- **Gemini calls** — `src/api/gemini.js` (plain REST `fetch`, no SDK).
- **UI** — `src/components/DocumentPanel.jsx` (upload/manage docs), `ChatPanel.jsx` (chat).

Documents and embeddings live only in memory — a page refresh clears them.

## Security warning

This is a **lab/demo** setup: the API key is read from a `VITE_` env var and is
therefore **bundled into the browser**, where anyone can read it. Use a free,
unbilled Google AI Studio key. For production, move the Gemini calls behind a
backend proxy that holds the key.

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Get a key at <https://aistudio.google.com/app/apikey>.
3. Create your env file and paste the key:
   ```sh
   cp .env.example .env
   # edit .env, set VITE_GEMINI_API_KEY=...
   ```
4. Run the dev server:
   ```sh
   npm run dev
   ```
5. Open the printed URL, upload a `.txt`/`.md` file, and ask a question.

## Configuration

Optional overrides in `.env` (defaults shown):

| Variable                   | Default              | Purpose          |
| -------------------------- | -------------------- | ---------------- |
| `VITE_GEMINI_CHAT_MODEL`   | `gemini-2.5-flash`   | Chat model       |
| `VITE_GEMINI_EMBED_MODEL`  | `text-embedding-004` | Embedding model  |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
