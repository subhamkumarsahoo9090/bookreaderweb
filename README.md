# AksharaX Web

Next.js frontend for AksharaX — reading, vocabulary, study, classroom, shared books, Google login/Drive, PWA.

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
| `/login` `/register` | Email or Continue with Google |
| `/folders` | Library folders + multi-format / audio upload + OCR language |
| `/documents/[id]` | Read + floating Edit panel, quiz, translate, fonts |
| `/shared` | AksharaX Books (admin-published) |
| `/admin` | Admin catalog upload (role=admin only) |
| `/study` | Spaced-repetition flashcards |
| `/search` | Full-library search |
| `/notes` `/vocabulary` | Notes & snippets |
| `/classroom` | Teacher classes + invite codes |
| `/library` | Public shared docs |
| `/settings` | Fonts, Drive connect, dyslexia, export, PWA |

## Admin login

Seeded on server start (see server README): use the configured `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
