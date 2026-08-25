# BookReader Web

Next.js frontend for the Book Reader API — OCR’d reading with tap-to-define and vocabulary.

## Setup

1. Start the backend (`bookreaderserver`) on `http://localhost:5000`.
2. In this folder:

```bash
npm install
cp .env.local.example .env.local   # or use existing .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env` / `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
GROQ_API_KEY=gsk_...
```

Get a free `GROQ_API_KEY` from [Groq Console](https://console.groq.com/keys).  
It is used only on the server (`POST /api/explain`) with `openai/gpt-oss-20b` — never expose it as `NEXT_PUBLIC_*`.

When a reader taps a word or highlights a sentence, Groq returns a simple explanation plus 3 everyday example sentences.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing (redirects to folders when logged in) |
| `/login`, `/register` | Auth |
| `/folders` | Folder list + create |
| `/folders/[folderId]` | Documents + upload/OCR |
| `/documents/[id]` | Interactive reader |
| `/vocabulary` | Saved words |

JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>`.
