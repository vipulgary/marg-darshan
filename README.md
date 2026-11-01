# Astromax

Bilingual (Hindi default, English toggle) Vedic astrology, Vastu and gemstone consulting platform.

| Doc | What it is |
|---|---|
| [Final Plan.md](Final%20Plan.md) | Architecture, data model, business logic, all tickets with acceptance criteria |
| [design.md](design.md) | UI/UX design system ("Cosmic Saffron") |
| [task.md](task.md) | Live progress tracker (generated — do not edit by hand) |

## Layout

```
apps/web      Next.js 16 (App Router) — site, booking, payments, API routes, Prisma
apps/engine   Python FastAPI astro engine (AGPL) — charts, doshas, yogas, rectification, panchang
infra/        docker-compose for Postgres, Redis, engine, worker, Listmonk
scripts/      i18n check, task tracker generator
```

## Run the web app

```bash
npm install
cp .env.example .env          # fill DATABASE_URL at minimum
npm run dev                   # http://localhost:3000 (Hindi) · /en (English)
```

Database (needs Postgres, e.g. `docker compose -f infra/docker-compose.yml up postgres`):

```bash
cd apps/web
npx prisma migrate dev --name init
npx prisma db seed
```

Checks:

```bash
npm run i18n:check
npm run typecheck
npm run lint
cd apps/web && node --import tsx --test "src/**/*.test.ts"
```

## Run the engine

`pyswisseph` ships no Windows wheels; on Windows install **Microsoft C++ Build Tools** first, or run the engine in Docker.

```bash
cd apps/engine
python -m venv .venv            # Python 3.11–3.13
.venv/Scripts/pip install -r requirements.txt -r requirements-dev.txt   # bin/pip on Linux/macOS
python scripts/install_ephe.py
uvicorn app.main:app --reload --port 8000
pytest -q
```

## Track progress

```bash
node scripts/set-task.mjs done AMX-031 AMX-032          # or doing / todo, optional --note "…"
node scripts/gen-tasks.mjs                              # regenerate task.md from tasks.json
```
