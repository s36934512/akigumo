# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Production runtime stage
FROM caddy:2-alpine AS runtime

# 複製 Angular CSR 靜態檔案
COPY --from=builder /app/dist/frontend/browser /usr/share/caddy

# Caddy 設定
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
