# OW Roster

Site équipe esport Overwatch (Next.js + Prisma + Neon Postgres).

## Setup local

```bash
cp .env.example .env
# Renseigne DATABASE_URL + AUTH_SECRET
npm install
npx prisma db push
npm run db:demo   # optionnel
npm run dev
```

## Deploy Vercel

1. Importe le repo sur Vercel.
2. Dans **Settings → Environment Variables**, ajoute :
   - `DATABASE_URL` — URL Neon **pooled** (`…-pooler…` / `sslmode=require`)
   - `AUTH_SECRET` — secret aléatoire (ex. `openssl rand -base64 32`)
3. Redeploy.

Sans ces variables, le build ou le runtime échouent (Prisma / NextAuth).
