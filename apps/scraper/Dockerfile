ARG NODE_VERSION=22
ARG APP_DIRNAME="scraper"
ARG PROJECT="@spanish-football-signings/scraper"

FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

FROM alpine AS base
RUN corepack enable
RUN npm install turbo --global

RUN pnpm config set store-dir ~/.pnpm-store

FROM base AS pruner
ARG PROJECT
WORKDIR /app
COPY . .
RUN turbo prune --scope=${PROJECT} --docker

FROM base AS builder
ARG PROJECT
ENV CI=true
WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/ .

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --no-frozen-lockfile
RUN turbo build --filter=${PROJECT}

FROM mcr.microsoft.com/playwright:v1.54.1-noble AS runner
ARG APP_DIRNAME

RUN groupadd --system --gid 1002 signings-group
RUN useradd --system --uid 1002 --gid 1002 --create-home signings-user

WORKDIR /app
COPY --from=builder --chown=signings-user:signings-group /app .

USER signings-user

WORKDIR /app/apps/${APP_DIRNAME}
ENV NODE_ENV=production

CMD ["node", "--experimental-sqlite", "dist/main.js"]