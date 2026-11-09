# VU StudyMate AI 🎓

A zero-budget MVP for Virtual University learners. Turn lecture transcripts and text-based PDF handouts into study notes, important concepts, and source-anchored practice quizzes.

## Status

- ✅ React + Vite + TypeScript responsive dashboard and PWA
- ✅ Transcript entry and local PDF text extraction (max 5 MB, 40 pages, 15,000 characters)
- ✅ **Clearly labeled fixed demo** with 5 working MCQs, quiz scoring and feedback
- ✅ Authenticated Gemini integration via Supabase Edge Function (requires your own credentials)
- ✅ Atomic 3-generations/user/day quota with Postgres function
- ⏳ VULMS/YouTube direct video ingestion is **not implemented** (requires authorized transcript access)
- ⏳ AI tutor, spaced repetition, course library and automated deployment are future work

## Run locally

```bash
npm install
npm run dev
npm run build
npm test
```

Without credentials, the sample lesson works immediately. AI requests are disabled until the backend is configured; the sample is **not** presented as AI-generated.

## Enable real AI (free-tier eligible, limits apply)

1. Create a free [Supabase](https://supabase.com/) project and a [Google AI Studio](https://aistudio.google.com/) API key. Review provider usage and data policies before sending content.
2. In Supabase **SQL Editor**, run `supabase/migrations/001_ai_usage.sql`.
3. Enable email OTP / magic-link sign-in under **Authentication** and set site URL and redirect URLs for your deployed site.
4. Install Supabase CLI or run deployment in your environment, link the project and deploy `supabase/functions/study-generate/index.ts`:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase secrets set GEMINI_API_KEY=YOUR_API_KEY
   npx supabase functions deploy study-generate
   ```
   Keep **JWT verification enabled** for this function. Supabase currently offers multiple JWT signing modes; test a real authenticated call after deployment and adjust verification per Supabase's current guidance if required. Do not disable user validation inside the function.
5. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase publishable/anon key). **Never** put `GEMINI_API_KEY` in frontend variables or GitHub.
6. Run `npm run dev`, enter email for a magic link, then paste lecture text and click **Generate with AI**.

## Deploy free static frontend

- Cloudflare Pages → Connect GitHub repository.
- Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as frontend build environment variables if real AI is enabled.
- Set your deployment URL as an allowed Auth redirect URL in Supabase.
- PWA installability varies by browser/device; public HTTPS is required.

## Safety and cost controls

- No automatic payments or paid fallback.
- AI call requires a verified Supabase user, 3/day atomic quota in Postgres; allow for provider's own quota enforcement.
- API key stays in a server-side Supabase secret. Do not share passwords or private LMS credentials.
- Input limit 15K characters, PDF 5MB / 40 text pages; scan-only PDFs need OCR (not supported).
- Processing YouTube/VULMS links is deliberately not automatic; do not scrape authenticated LMS or circumvent platform access restrictions.
- AI outputs can be incorrect. Verify source quotes, examples and answers before relying on them for exams.
- Initial use of free AI tiers may carry data privacy considerations; upload only content you are permitted to process.
- This is a public repository. Avoid committing real student data, copyrighted course dumps or secrets.

## License

Prototype for learning and validation. No institutional affiliation or endorsement by Virtual University of Pakistan.
