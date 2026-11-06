#!/bin/sh

export AKIGUMO_ROOT="/workspace"
export PYTHON_BIN="/workspace/python/.venv/bin/python"

exec npx concurrently \
    -n backend,frontend,worker \
    -c blue,green,yellow \
    "npm run dev:backend" \
    "npm run dev:frontend" \
    "npm run dev:worker"