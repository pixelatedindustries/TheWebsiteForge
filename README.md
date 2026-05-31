# Lumina Studio — Website Showcase & Sales Site

A premium marketing site for a studio that **builds and sells websites**. Dark,
aurora-glass aesthetic on a **green × blue** theme, with scroll animations, a
live backend, and a working contact pipeline.

## Tech stack

- **Nuxt 4** (Vue 3) — SSR, file-based routing, Nitro backend
- **Tailwind CSS v4** — CSS-first config via the `@tailwindcss/vite` plugin
- **@vueuse/motion** — scroll-triggered reveal animations
- **@nuxt/fonts** — self-hosted Inter + Space Grotesk
- **@vueuse/nuxt** — composables (scroll state, etc.)
- **pnpm**

## Pages

| Route        | Sections                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| `/`          | Hero, logo marquee, featured showcase, stats, process, pricing, proof, CTA |
| `/showcase`  | Filterable project gallery (filtered server-side), proof metrics, CTA    |
| `/pricing`   | Plan cards, comparison table, FAQ, CTA                                   |
| `/about`     | Story, live stats, values, process, testimonials, CTA                    |
| `/contact`   | Pitch + working contact form wired to the backend                        |

The three required sections are present throughout: **hero** (`/`), **pricing**
(`/` + `/pricing`), and **showcase × proof** (`/` + `/showcase`).

## Backend (Nitro API routes)

| Endpoint                  | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `GET /api/projects`       | Showcase data; supports `?category=` and `?status=` filters    |
| `GET /api/stats`          | Headline stats + figures derived live from the catalogue       |
| `POST /api/contact`       | Validates a lead, runs a honeypot check, persists it to storage |

Leads are written to file-backed storage at `./.data/leads` (configured in
`nuxt.config.ts`). Swap the storage write in
[`server/api/contact.post.ts`](server/api/contact.post.ts) for an email/CRM call
in production.

## Project structure

```
yourwebsitesource/
├── app/
│   ├── app.vue                 # Root: <NuxtLayout><NuxtPage/></NuxtLayout>
│   ├── layouts/default.vue     # Aurora bg + header + footer shell
│   ├── pages/                  # index, showcase, pricing, about, contact
│   ├── components/             # Header, footer, sections, cards (auto-imported)
│   ├── utils/motion.ts         # reveal() animation helper (auto-imported)
│   └── assets/css/main.css     # Tailwind v4 @theme tokens + glass/aurora utilities
├── server/api/                 # Nitro backend routes
├── shared/site.ts              # Typed content + types, shared by app and server
├── public/                     # Static assets
└── nuxt.config.ts
```

`shared/site.ts` is the single source of truth for all content. Edit projects,
pricing, testimonials, stats, and FAQs there — both the UI and the API pick it up.

## Theme

Defined as CSS-first tokens in [`app/assets/css/main.css`](app/assets/css/main.css):

- `--color-brand-*` — emerald → teal green spectrum
- `--color-accent-*` — cyan → blue spectrum
- `--color-ink-*` — deep navy-green dark surfaces

Use them as Tailwind utilities: `bg-brand-500`, `text-accent-300`,
`from-brand-400 to-accent-600`, `bg-ink-950`, etc.

## Commands

```bash
pnpm install      # install dependencies
pnpm dev          # dev server (http://localhost:3000)
pnpm build        # production build (.output/)
pnpm preview      # preview the production build
node .output/server/index.mjs   # run the built server directly
```

## Customising

- **Content** → `shared/site.ts`
- **Brand name / logo** → search for `Lumina` and `LogoMark.vue`
- **Colors / fonts** → `app/assets/css/main.css` (`@theme` block)
- **Real screenshots** → replace `ProjectCover.vue` with `<NuxtImg>` (add `@nuxt/image`)
- **Lead delivery** → `server/api/contact.post.ts`
