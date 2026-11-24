# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Production runtime stage
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# 只安裝正式環境依賴
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 複製 Angular SSR 編譯產物
COPY --from=builder /app/dist/frontend ./dist/frontend

EXPOSE 4000

CMD ["node", "dist/frontend/server/server.mjs"]
