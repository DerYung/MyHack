# EcoLink — AI Startup Ecosystem Platform

EcoLink connects early-stage startups with the right mentors and funders using an AI matching pipeline. Instead of cold outreach, founders get ranked matches with justifications, a swipe-style funder discovery interface, AI-generated investor briefs verified against real web sources, and an interactive ecosystem graph of every connection.

> **Live demo:** https://myhack-c503.onrender.com
> **Demo video:** _[add your Loom link here]_

Built in a 24-hour hackathon (GDG KL).

---

## Features

### For Startups

- **Submit a profile** — describe your startup, sector, stage, funding needs, and goals
- **AI mentor matching** — ranked mentor recommendations with match scores and reasoning
- **Funder discovery** — browse and swipe through funders, save favourites, connect directly
- **Saved funders** — review and connect with saved funders from a dedicated page
- **Investor brief** — AI-generated brief verified against real web sources via Google Search grounding

### For Mentors

- **Deal flow** — swipe through startup match requests (Tinder-style), accept to create a linkage
- **Ecosystem graph** — visualise all active mentee connections

### For Funders

- **Deal flow** — swipe through investment-ready startups ranked by AI score
- **Co-investment view** — see detailed startup profiles and create linkages
- **Ecosystem graph** — visualise all active portfolio connections

### For Admins

- **Admin dashboard** — overview of users, companies, and linkages across the ecosystem
- **Inference engine** — inspect the matching pipeline and its stage-by-stage metadata

### Shared

- **Role-based dashboards** — each user type sees a tailored dashboard on login (`/dashboard` routes by role)
- **Ecosystem graph** — interactive SVG graph of your connections; click any node to view details or mark a relationship as completed
- **Google Sign-in** — one-click auth via Firebase, with role onboarding for new users

---

## AI Pipeline

The matching engine ranks candidates through a two-stage pipeline:

```
Stage 1 — Hard Filter
  Filter candidates by sector, stage, budget range, and region
  Reduces the full dataset to top N candidates

Stage 2a — Embedding Similarity
  Convert startup + mentor/funder profiles to vector embeddings
  Rank by cosine similarity (text-embedding-005)
  Returns top-K candidates

Stage 2b — Gemini Scoring
  Send top-K candidates to Gemini 2.5 Flash
  Returns a 0–100 match score + 2-sentence justification + risk flag per candidate
  Final ranked list returned to the frontend
```

The API also reports per-stage timing and candidate counts (`PipelineMetadata`) so the funnel is fully observable — surfaced in the admin **Inference Engine** view.

**Investor Brief Generation** uses Gemini with Google Search grounding — the model searches for the company online before generating the brief, cross-referencing submitted claims against real sources and flagging discrepancies.

---

## Tech Stack


| Layer         | Technology                                                                |
| ------------- | ------------------------------------------------------------------------- |
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS                                  |
| UI Components | Radix UI, shadcn/ui, Lucide icons, MUI                                    |
| Animations    | Motion (Framer Motion) — parallax landing page, swipe gestures, confetti |
| Backend       | Python, FastAPI, Uvicorn                                                  |
| Database      | Firebase Firestore                                                        |
| Auth          | Firebase Auth (Google Sign-in)                                            |
| AI / ML       | Gemini 2.5 Flash, Google Search Grounding, text-embedding-005             |
| Deployment    | Render — Static Site (frontend) + Web Service (backend)                  |

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── pages/          # Route-level pages (dashboards, matching, briefs, browse, admin)
│   │   ├── components/     # Shared components (Layout, EcosystemGraph, UI primitives)
│   │   ├── services/       # Firestore service layer (startups, mentors, funders, linkages, health)
│   │   ├── contexts/       # AuthContext (Google sign-in, role, session)
│   │   ├── lib/            # API clients (matching.ts, briefs.ts)
│   │   ├── types/          # Firestore document types
│   │   └── routes.tsx      # React Router route table
│   ├── lib/firebase.ts     # Firebase init (reads VITE_FIREBASE_* env vars)
│   └── styles/             # Global styles / Tailwind
│
├── backend/
│   ├── routers/            # FastAPI route handlers (matching, briefs)
│   ├── services/           # Firestore client, Gemini scorer, embeddings, hard filter
│   ├── models/             # Pydantic schemas + Firestore models
│   ├── config.py           # Settings (pydantic-settings, reads backend/.env)
│   └── main.py             # FastAPI app, CORS, router registration, /api/health
│
├── render.yaml             # Render Blueprint (both services as infrastructure-as-code)
└── index.html              # Vite SPA entry point
```

---

## API Endpoints


| Method | Path                   | Description                                |
| ------ | ---------------------- | ------------------------------------------ |
| POST   | `/api/match/mentors`   | Rank mentors for a company                 |
| POST   | `/api/match/funders`   | Rank funders for a company                 |
| POST   | `/api/briefs/generate` | Generate a web-grounded investor brief     |
| GET    | `/api/health`          | Health check (used by Render + keep-alive) |

---

## Running Locally

### Frontend

```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

In dev, the frontend proxies `/api/*` to the backend automatically via Vite's dev server config, so no `VITE_API_URL` is needed locally.

### Environment Variables

Two separate `.env` files — one per trust domain. **Never mix them.**

**Frontend** — `.env` at the **project root** (read by Vite at build time, shipped to the browser; all `VITE_`-prefixed):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Optional in dev (Vite proxy handles /api). Required in prod to point at the backend.
VITE_API_URL=
```

**Backend** — `backend/.env` (read by Python at runtime, server-only, never exposed):

```
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_CLOUD_PROJECT=your_firebase_project_id
FIRESTORE_DATABASE=your_database_name
```

> `service-account.json` is the Firebase Admin service-account key. It is git-ignored — never commit it.

---

## Deployment (Render)

The app runs as **two Render services**, defined in `render.yaml`:

### 1. Backend — Web Service (Python)

- **Root Directory:** `backend`
- **Build:** `pip install -r requirements.txt`
- **Start:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/api/health`
- **Env vars:** `GOOGLE_API_KEY`, `GOOGLE_CLOUD_PROJECT`, `FIRESTORE_DATABASE`, `PYTHON_VERSION=3.11.0`, and `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/service-account.json`
- **Secret File:** upload `service-account.json` under Environment → Secret Files (lands at `/etc/secrets/service-account.json`)

### 2. Frontend — Static Site (Vite)

- **Build:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Env vars:** the six `VITE_FIREBASE_*` values + `VITE_API_URL` (the backend's public URL). These are baked in **at build time**, so set them before the build and redeploy after any change.
- **Rewrite rule (required):** `/*` → `/index.html` (Action: **Rewrite**) so client-side routes resolve on refresh/deep-link instead of 404ing.

### Post-deploy checklist

- [ ]  Add the deployed frontend domain (e.g. `myhack-c503.onrender.com`) to **Firebase → Authentication → Settings → Authorized domains**, or Google Sign-in returns `auth/unauthorized-domain`.
- [ ]  Confirm the `/*` → `/index.html` rewrite exists on the Static Site.
- [ ]  Optional: a keep-alive ping (UptimeRobot / Cloudflare Worker cron) hitting `/api/health` every ~10 min to avoid free-tier backend cold starts.

> **Note:** on Render's free tier, the backend Web Service spins down after ~15 min of inactivity; the first request after idle has a ~30–60s cold start. The frontend Static Site is CDN-served and always instant.

---

## Data Model

```
companies   — startup profiles (sector, stage, budget, status, ai_score)
mentors     — mentor profiles (expertise, industries, availability)
funders     — funder profiles (investment range, focus, stage interest)
linkages    — relationships between any two parties
              type: 'mentor-matching' | 'funder-syndication'
              status: 'active' | 'pending_approval' | 'completed' | 'rejected'
```

---
