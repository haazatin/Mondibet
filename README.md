# Mondibet

Mondibet is a responsive web application for managing a friendly FIFA World Cup betting game.

## Stack

- Next.js on Vercel
- Supabase for Postgres and auth, with Google SSO as the primary sign-in method
- TypeScript scoring engine with tests

## Documentation

Project documentation lives in [`docs/`](./docs).

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in Supabase values before using backend features.

## Deployment

Vercel production and preview environments need:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

After deployment, add the deployed app URL to Supabase Auth redirect URLs.
