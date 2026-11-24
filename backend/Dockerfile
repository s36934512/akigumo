# Build stage
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./

# Placeholder for Prisma generation
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN npm run prisma:generate

RUN npm run build


# Migration stage
FROM build AS migrate

CMD ["node", "entrypoint.js", "npm", "run", "prisma:migrate"]


# Production runtime
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package.json backend/package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY backend/entrypoint.js ./entrypoint.js

EXPOSE 3000

CMD ["node", "entrypoint.js", "node", "dist/index.js"]
