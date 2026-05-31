123pricing, testimonials, stats, and FAQs there — both the UI and the API pick it up.

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
