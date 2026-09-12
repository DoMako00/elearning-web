FROM node:22-alpine AS web-build

WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/vite.config.ts web/tsconfig*.json web/index.html ./
COPY web/src ./src

ARG VITE_ADMIN_DATA_SOURCE=mock
ARG VITE_API_BASE_URL=/api
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_PUBLISHABLE_KEY=

ENV VITE_ADMIN_DATA_SOURCE=${VITE_ADMIN_DATA_SOURCE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

RUN npm run build

FROM nginx:1.27-alpine AS web-runtime

COPY deploy/docker/nginx.web.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/web/dist /usr/share/nginx/html

EXPOSE 80
