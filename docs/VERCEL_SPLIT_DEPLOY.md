# Web3Star Split Deployment (Recommended)

This project is now organized for split operation:

- Landing/Homepage: `/`
- App product: `/app/*`

Use this guide to manage Home and App as separate products on Vercel.

## Option A (Fast): Single repo, one deploy

Deploy this repo to one Vercel project.

- Main homepage: `https://your-domain/`
- App: `https://your-domain/app`

`vercel.json` already includes SPA rewrite handling.

## Option B (Recommended): Two Vercel projects

Create two projects from this codebase lifecycle:

1. **Home project**
   - Domain: `web3star.org`
   - Route focus: `/`
2. **App project**
   - Domain: `app.web3star.org`
   - Route focus: `/app/*` (or use a dedicated app repo later)

If you later split repositories:

- Keep homepage files/routes in home repo
- Keep app/auth/mining flows in app repo

## Required environment variables (App project)

Set these in Vercel Project Settings -> Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OAUTH_CALLBACK_URL` (optional for native OAuth callback pages)
- `VITE_GOOGLE_WEB_CLIENT_ID`

## Domain routing recommendation

- `web3star.org` -> Home project
- `app.web3star.org` -> App project

In homepage CTA buttons, link users to:

- `https://app.web3star.org/app/login` (or `/app/login` if same domain)

## GitHub Pages + custom domain (e.g. web3star.org)

The default Pages build uses Vite **`base: /`**. That matches a **custom domain at the site root**.

If you only use **`https://<user>.github.io/<RepositoryName>/`**, set a repository **Actions variable** named **`PAGES_BASE`** to your project path with slashes, e.g. **`/Web3star/`**, so asset URLs resolve correctly.

Without the right `base`, the HTML will request `/Web3star/assets/...` while the domain serves files at `/assets/...` → **blank site and `/admin` not working**.

## Notes

- Existing legacy links `/login`, `/signup`, `/splash` auto-redirect to `/app/*`.
- App internal navigation and protected routes are aligned to `/app`.
