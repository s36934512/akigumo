#!/bin/bash

set -e

echo "==> Setting up Node.js environment"

npm install -g npm@12.0.2

if [ -f "/workspace/package-lock.json" ]; then
    cd /workspace
    npm ci
fi

# Frontend
echo "==> Installing Frontend dependencies"

cd /workspace/frontend
npm ci

# Backend
echo "==> Installing Backend dependencies"

cd /workspace/backend
npm ci

npm run prisma:generate
npm run prisma:migrate

# Python
echo "==> Setting up Python environment"

cd /workspace/python
uv sync

echo "==> Akigumo development environment is ready"
