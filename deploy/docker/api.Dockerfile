FROM node:22-alpine AS api-build

WORKDIR /app

# The API build uses TypeScript from the locked web toolchain only inside this build stage.
COPY web/package.json web/package-lock.json ./web/
RUN cd /app/web && npm ci

COPY api/package.json api/package-lock.json api/tsconfig.json api/tsconfig.build.json ./api/
RUN cd /app/api && npm ci
COPY api/src ./api/src
RUN node /app/web/node_modules/typescript/bin/tsc -p /app/api/tsconfig.build.json --pretty false
RUN cd /app/api && npm prune --omit=dev

FROM node:22-alpine AS api-runtime

LABEL org.opencontainers.image.title="elearning-api"
LABEL org.opencontainers.image.description="Mock-backed API HTTP skeleton"

WORKDIR /app/api

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3000
ENV ADMIN_RUNTIME_MODE=mock

COPY --chown=node:node --from=api-build /app/api/package.json ./package.json
COPY --chown=node:node --from=api-build /app/api/node_modules ./node_modules
COPY --chown=node:node --from=api-build /app/api/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
