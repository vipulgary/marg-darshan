# Marg Darshan — web app (`apps/web`)

Next.js 16 (App Router) + Prisma 7 + next-intl. Setup, configuration and deployment are documented
in the [root README](../../README.md); operations and pending items in
[docs/HANDOVER.md](../../docs/HANDOVER.md).

```bash
npm run dev            # from the repo root, http://localhost:3000
npx prisma migrate deploy && npx prisma db seed   # from this folder
```

| Path | Contents |
|---|---|
| `src/app/[locale]` | public pages (Hindi default, `/en` English) |
| `src/app/api` | API routes: auth, booking, payments, kundali, geo, newsletter, cron… |
| `src/app/admin` | admin panel (password login) |
| `src/lib` | business logic (booking, payments, auth, notifications, engine client) |
| `messages/{hi,en}` | translations — keep keys identical (`npm run i18n:check`) |
| `prisma/` | schema, migrations, seed |

Note: this Next.js version has breaking changes from older releases — see `AGENTS.md`.
