# Glimmora ONE

AI-powered consciousness intelligence platform — OTT streaming, AI wisdom companion, reflection engine, and consciousness journeys in one app.

Built on the chassis defined in `SKELETON.md`: **Next.js 15 (App Router) + FastAPI living in one Git repo, one DigitalOcean App Platform deployment, sharing a JWT secret.**

## Stack

- **Frontend:** Next.js 15 (App Router, RSC), TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, `jose` for JWT verification.
- **Backend:** FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, PyJWT, bcrypt.
- **Database:** SQLite (dev) / Postgres (prod) via the same models — Alembic auto-detects the dialect.
- **AI:** OpenAI-compatible. Endpoints return 503 if `OPENAI_API_KEY` is unset.

## Layout

```
glimmora-one/
├── apps/web/           # Next.js frontend
├── backend/            # FastAPI service
│   ├── app/
│   │   ├── routers/    # one router per domain
│   │   └── ai/         # AI orchestration
│   └── alembic/        # migrations
├── scripts/            # dev launchers
├── .do/app.yaml        # DigitalOcean spec
└── docker-compose.yml  # local Postgres + both halves
```

## Quick start

```bash
# 1. Backend
cd backend
python -m venv .venv
./.venv/Scripts/pip install -e .       # Windows
# .venv/bin/pip install -e .           # macOS/Linux
cp ../.env.example .env
./.venv/Scripts/alembic upgrade head
cd ..

# 2. Frontend
pnpm install
cp .env.example apps/web/.env.local    # edit BACKEND_URL & JWT_SECRET

# 3. Run both
pnpm dev
```

Frontend on `http://localhost:3000`, API on `http://localhost:8000` (`/docs` for OpenAPI).

Default login (created on first boot from env vars):
- username: `superadmin`
- password: see `BOOTSTRAP_SUPERADMIN_PASSWORD` in `.env`

## Domain modules

| Router | Path prefix | Purpose |
|---|---|---|
| `auth` | `/v1/auth` | login, signup, refresh, logout, me |
| `users` | `/v1/users` | profile, preferences |
| `content` | `/v1/content` | OTT catalog, episodes, watch progress |
| `ai` | `/v1/ai` | AI companion chat, reflection prompts, recommendations |
| `reflection` | `/v1/reflection` | journal entries, emotional trends, digital twin |
| `community` | `/v1/community` | reflection circles, anonymous threads |
| `creator` | `/v1/creator` | creator studio, content publishing, analytics |
| `billing` | `/v1/billing` | subscription tiers, entitlements |
| `admin` | `/v1/admin` | user mgmt, moderation, platform config |

## Deployment

Push to `main`. DigitalOcean reads `.do/app.yaml`, runs the `migrate` PRE_DEPLOY job, then deploys `api` (routes `/v1/*` and `/uploads/*`) and `web` (routes `/*`). One domain, no CORS in prod.

See `SKELETON.md` for the canonical conventions this repo follows.

For the end-user-facing feature reference (and the protocol for keeping it in sync with the code), see [`docs/USER_MANUAL.md`](./docs/USER_MANUAL.md). **Update it in the same PR as any user-visible change.**
