#!/bin/sh

exec npx concurrently \
    -n backend,frontend,worker \
    -c blue,green,yellow \
    "npm run dev:backend" \
    "npm run dev:frontend" \
    "npm run dev:worker"