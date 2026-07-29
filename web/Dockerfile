# syntax=docker/dockerfile:1
#
# Production image for the Next.js public site. Uses Next's "standalone" output
# so the final image ships only the traced server bundle + static assets (small,
# no full node_modules). Debian-slim (not alpine) so sharp's glibc prebuilt
# binary powers next/image optimization without musl workarounds.
#
# NEXT_PUBLIC_* are inlined at BUILD time, so they arrive as build args (Render
# passes a service's env vars to the Docker build as build args). They MUST be
# set before the first deploy or the site points at localhost.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH" NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- Dependencies (cached unless the manifests change) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_ORIGIN
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_HOST
ARG NEXT_PUBLIC_ADSENSE_CLIENT
ARG NEXT_PUBLIC_ADSENSE_AUTO_ADS
ARG NEXT_PUBLIC_ADSENSE_SLOT_HEADER
ARG NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR
ARG NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST \
    NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT \
    NEXT_PUBLIC_ADSENSE_AUTO_ADS=$NEXT_PUBLIC_ADSENSE_AUTO_ADS \
    NEXT_PUBLIC_ADSENSE_SLOT_HEADER=$NEXT_PUBLIC_ADSENSE_SLOT_HEADER \
    NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=$NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR \
    NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT=$NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT
RUN pnpm build

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs
# Standalone server + its static assets and public files.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
# Render injects $PORT; Next's standalone server reads it (default 3000).
EXPOSE 3000
CMD ["node", "server.js"]
