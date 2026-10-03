#!/bin/bash

set -e

echo "==> Setting up Node.js environment"

npm install -g npm@12.0.2

npm install

cd /workspace/frontend
npm install

cd /workspace/backend
npm install
npm run prisma:generate
npm run prisma:migrate

echo "==> Setting up Python environment"

cd /workspace/python

if [ ! -d ".venv" ]; then
    python3.13 -m venv .venv
fi

.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e .

echo "==> Akigumo development environment is ready"