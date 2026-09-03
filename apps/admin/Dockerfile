# Monorepo image for the `admin` app.
# Build from the REPO ROOT so every workspace package is in the context:
#
#   docker build -f apps/admin/Dockerfile --build-arg DATABASE_URL=postgresql://... .
#
# The Debian-based `oven/bun:1` image (not alpine) matches Prisma's default
# engine target (debian-openssl-3.0.x), so `prisma generate` works untouched.

FROM oven/bun:1 AS build
WORKDIR /app

# Copy the whole workspace (root .dockerignore keeps node_modules, build
# output, and .env files out) so bun can link every @repo/* package.
COPY . .
RUN bun install --frozen-lockfile

# `turbo run build` runs @repo/database's `prisma generate` first, which loads
# DATABASE_URL through prisma.config.ts and fails when it is unset. Nothing
# connects to the database during the build, so any well-formed Postgres URL
# works here; pass the real one with --build-arg to keep parity with runtime.
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL
RUN bunx turbo run build --filter=admin

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Ship the built workspace (apps/admin/build, packages/database/generated,
# workspace symlinks) and drop devDependencies now that the build exists.
COPY --from=build /app /app
RUN bun install --frozen-lockfile --production

# react-router-serve binds 0.0.0.0 and reads PORT (Railway injects it).
WORKDIR /app/apps/admin
EXPOSE 3000
CMD ["bun", "run", "start"]
