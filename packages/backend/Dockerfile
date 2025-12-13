FROM node:18-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

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
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared package first
RUN pnpm --filter @task-assistant/shared build

# Generate Prisma Client
RUN pnpm --filter @task-assistant/backend exec prisma generate --schema=src/prisma/schema.prisma

# Build backend
RUN pnpm --filter @task-assistant/backend build

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
RUN npm install -g pnpm
RUN apk add --no-cache openssl

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy package-specific node_modules (required for pnpm to resolve dependencies correctly)
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# We need to copy node_modules for the packages as well if they are hoisted, 
# but usually pnpm install in the root handles it. 
# However, for production run, we might want to prune devDependencies.
# For simplicity in this monorepo setup, we are copying the root node_modules.

USER expressjs

EXPOSE 3001

CMD ["node", "packages/backend/dist/server.js"]
