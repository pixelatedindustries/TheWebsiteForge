# YourWebsiteSource

A polished Nuxt 4 website for selling premium websites, showcasing available projects,
explaining pricing, and collecting leads through a working contact pipeline.

The experience is built around a dark, high-contrast visual system with motion,
proof-led sales sections, generated project covers, and server-backed catalogue and
contact routes.

## Highlights

- Conversion-focused home page with hero, proof, pricing, process, showcase, and CTA sections
- Filterable project showcase powered by server-side API filters
- Pricing page with plan cards, comparison content, FAQ, and project CTA
- About and contact pages for trust-building and lead capture
- Nitro API routes for projects, stats, and contact form submissions
- Centralized content model in `shared/site.ts`
- Tailwind CSS v4 design tokens and reusable visual utilities

## Tech Stack

- **Nuxt 4** and **Vue 3** for SSR, routing, and app structure
- **Nitro** for backend API routes and file-backed lead storage
- **Tailwind CSS v4** through the `@tailwindcss/vite` plugin
- **@vueuse/motion**, **GSAP**, and **Lenis** for animation and smooth scrolling
- **@nuxt/fonts** for Inter and Space Grotesk
- **Three.js** for rich visual components
- **pnpm** for dependency management

## Pages

| Route       | Purpose                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| `/`         | Main sales page with hero, stats, featured showcase, process, pricing, proof, and CTA |
| `/showcase` | Filterable catalogue of available, sold, and featured website builds                  |
| `/pricing`  | Pricing tiers, comparison content, FAQ, and conversion CTA                            |
| `/about`    | Brand story, values, process, stats, testimonials, and CTA                            |
| `/contact`  | Lead-focused contact page with a backend-backed form                                  |

## API Routes

| Endpoint            | Purpose                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `GET /api/projects` | Returns project catalogue data; supports `?category=` and `?status=` filters |
| `GET /api/stats`    | Returns headline stats and figures derived from the project catalogue        |
| `POST /api/contact` | Validates lead details, checks the honeypot field, and stores the submission |

Lead submissions are stored with Nitro storage at `./.data/leads`, configured in
`nuxt.config.ts`. For production, replace the storage write in
`server/api/contact.post.ts` with your email, CRM, or automation provider.

## Project Structure

```text
yourwebsitesource/
|-- app/
|   |-- app.vue                 # Root Nuxt app wrapper
|   |-- layouts/default.vue     # Global shell, background, header, and footer
|   |-- pages/                  # Home, showcase, pricing, about, and contact routes
|   |-- components/             # Reusable UI, sections, cards, and visual effects
|   |-- composables/            # Client-side composables
|   |-- plugins/                # Motion and browser integration
|   |-- utils/motion.ts         # Reveal animation helper
|   `-- assets/css/main.css     # Tailwind theme tokens and custom utilities
|-- server/api/                 # Nitro backend routes
|-- shared/site.ts              # Typed content shared by app and server
|-- public/                     # Static assets
|-- scripts/                    # Local helper scripts
|-- nuxt.config.ts              # Nuxt, fonts, app metadata, and Nitro storage config
`-- package.json
```

## Content Model

Most editable site content lives in `shared/site.ts`, including:

- Project catalogue entries
- Pricing tiers
- Testimonials
- Process steps
- FAQs
- Headline stats

Because the Vue app and Nitro routes both import this file, updates there are reflected
across the UI and API responses.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

The local site runs at:

```text
http://localhost:3000
```

## Commands

```bash
pnpm dev        # Start the Nuxt dev server
pnpm build      # Build for production
pnpm preview    # Preview the production build locally
pnpm generate   # Generate a static version where supported
pnpm postinstall # Prepare Nuxt after dependency installation
```

## Customization

- **Site content:** edit `shared/site.ts`
- **Global metadata:** edit `nuxt.config.ts`
- **Theme colors and utilities:** edit `app/assets/css/main.css`
- **Logo mark:** edit `app/components/LogoMark.vue`
- **Contact handling:** edit `server/api/contact.post.ts`
- **Static assets:** place files in `public/`

## Production Notes

Before deploying, connect `POST /api/contact` to a real delivery path such as email,
a CRM, or a webhook automation service. The current file-backed storage is useful for
local development and simple demos, but production lead handling should include
monitoring, spam protection, backups, and a notification workflow.
