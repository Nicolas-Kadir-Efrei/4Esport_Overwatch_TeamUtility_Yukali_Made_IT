# OW Roster

Site équipe esport Overwatch (Next.js + Prisma + Neon Postgres).

## Setup local

```bash
cp .env.example .env
# Renseigne DATABASE_URL + AUTH_SECRET (+ ADMIN_PASSWORD pour seed)
npm install
npx prisma db push
npm run db:setup   # local seulement
npm run dev
```

## Deploy Vercel

1. Importe le repo sur Vercel.
2. Variables d’environnement :
   - `DATABASE_URL` — Neon **pooled**
   - `AUTH_SECRET` — secret long aléatoire
   - `AUTH_URL` — URL publique du site (recommandé)
   - `ADMIN_PASSWORD` — si tu seeds en prod (évite le défaut)
3. Redeploy.

## Sécurité (résumé)

- Rate-limit login/register
- Sessions JWT 7j, invalidées si compte supprimé
- Uploads : magic bytes + allowlist chemins, max 2 Mo
- Headers : CSP, nosniff, frame deny
- Contacts / dispos : visibles seulement aux membres de l’équipe (+ admin)
- Dashboard / historique : scopés à ton équipe (admin = tout)
- `db:demo` bloqué en production
