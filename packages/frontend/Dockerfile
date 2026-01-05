# Dev stage - used by docker-compose.yml for development
FROM node:22-slim AS dev
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all packages
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for shared package (needed for build)
COPY packages/shared ./packages/shared

# Build shared package
RUN pnpm --filter @task-assistant/shared build

# Production builder stage
FROM node:22-slim AS builder
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all packages
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

# Build shared package first
RUN pnpm --filter @task-assistant/shared build

# Build frontend
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter @task-assistant/frontend build

# Runner stage
FROM node:22-slim AS runner
# Install pnpm; slim images use apt instead of apk
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN npm install -g pnpm

# Copy built artifacts
# We are assuming standalone output is not enabled by default in next.config.js, 
# so we copy the standard .next folder and node_modules.
# If standalone is enabled, we would copy .next/standalone.

COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/.next ./packages/frontend/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/frontend/package.json ./packages/frontend/package.json

# Copy package-specific node_modules (required for pnpm to resolve dependencies correctly)
COPY --from=builder /app/packages/frontend/node_modules ./packages/frontend/node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# We need to run next start from the frontend directory or adjust the command
WORKDIR /app/packages/frontend

CMD ["npm", "start"]
