# TheWebsiteForge — Nuxt 4 (SSR / Nitro node-server) production image.
# Built and run via docker-compose.prod.yml. Runtime secrets come from .env
# (Nuxt reads NUXT_* / server env at startup — no rebuild needed to change them).
#
# Debian slim (glibc) rather than alpine (musl): this app pulls native modules
# (sharp, @takumi-rs/core) whose prebuilt binaries are more reliable on glibc.
FROM node:22-slim

WORKDIR /app

# corepack ships with node and provisions the exact pnpm from package.json
# ("packageManager": "pnpm@11.5.2").
RUN corepack enable

# Install deps first (better layer caching). Include devDependencies — the
# container runs `drizzle-kit migrate` at startup, and drizzle-kit is a devDep.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build the Nuxt app -> .output (node-server preset).
COPY . .
RUN pnpm run build

ENV NODE_ENV=production \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

EXPOSE 3000

# Apply any pending Drizzle migrations, then start the Nitro server.
# DATABASE_URL is injected by compose (points at the `postgres` service).
CMD ["sh", "-c", "pnpm drizzle-kit migrate && node .output/server/index.mjs"]
