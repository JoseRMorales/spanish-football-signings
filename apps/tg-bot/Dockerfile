ARG NODE_VERSION=22
ARG APP_DIRNAME="tg-bot"
ARG PROJECT="@spanish-football-signings/tg-bot"

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

FROM base AS runner
ARG APP_DIRNAME

RUN addgroup --system --gid 1002 signings-group
RUN adduser --system --uid 1002 signings-user
RUN adduser signings-user signings-group
USER signings-user

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=signings-user:signings-group /app .
WORKDIR /app/apps/${APP_DIRNAME}

CMD ["node", "--experimental-sqlite", "dist/main.js"]
