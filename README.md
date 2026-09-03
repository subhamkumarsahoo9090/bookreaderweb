# BookReader Web

Next.js frontend for Book Reader — reading, vocabulary, study, classroom, public library, PWA.

## Setup

```bash
# bookreaderserver on :5000
cd bookreaderweb
npm install
npm run dev
```

`.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
GROQ_API_KEY=gsk_...
```

## Main routes

| Route | Purpose |
|-------|---------|
| `/folders` | Library folders + multi-format / audio upload |
| `/documents/[id]` | Read/Edit, quiz, translate, highlight, share, progress |
| `/study` | Spaced-repetition flashcards |
| `/search` | Full-library search |
| `/notes` | Notes |
| `/vocabulary` | Snippets |
| `/classroom` | Teacher classes + invite codes |
| `/library` | Public shared docs |
| `/settings` | Dyslexia, export, PWA, language |

Sync across devices = same login against MongoDB Atlas.
