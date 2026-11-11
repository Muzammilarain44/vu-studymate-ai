# VU StudyMate AI — MERN Backend Starter (Phase 1)

This ZIP adds a **server/** directory to the existing GitHub repository. It does **not** replace the existing frontend. Existing Supabase/Gemini integration remains unchanged until a later migration step.

## Upload
1. Extract this ZIP.
2. Open the **MERN-upgrade** branch of `Muzammilarain44/vu-studymate-ai` on GitHub.
3. Upload the `server` folder and its files into the repository root. If the GitHub mobile browser cannot upload folders, use GitHub's web editor or a PC to create the same paths.
4. Do not upload any real `.env` or secrets. `.env.example` contains placeholders only.

## Local run (Node.js LTS required)
1. Create a MongoDB Atlas M0 free database, a database user, and an appropriate IP access rule.
2. Copy `server/.env.example` to `server/.env` and fill MONGODB_URI and a strong random JWT_SECRET (32+ characters).
3. `cd server && npm install && npm run dev`
4. Test `GET http://localhost:4000/api/health`.

## Routes
- POST `/api/auth/register` — `{ "name": "Example", "email": "example@example.com", "password": "at-least-eight-characters" }`
- POST `/api/auth/login` — `{ "email": "...", "password": "..." }`
- GET `/api/auth/me` — Bearer token
- GET `/api/study-packs` — Bearer token
- POST `/api/study-packs` — Bearer token and study pack JSON
- DELETE `/api/study-packs/:id` — Bearer token

## Important limitations
This is an initial untested backend scaffold. It has not been run against MongoDB and is not yet connected to React. AI generation, frontend migration, integration tests, deployment and additional production hardening are still pending. No paid API is required for this scaffold; free hosting/database plans have limits.
