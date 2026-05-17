FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @glimmora/web... --prod=false --frozen-lockfile || pnpm install --filter @glimmora/web...

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo /repo
COPY . .
WORKDIR /repo/apps/web
RUN pnpm next build

FROM node:22-alpine AS run
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 8080
CMD ["pnpm", "next", "start", "-p", "8080"]
