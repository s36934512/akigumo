import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => {
    return c.json({
        status: "ok",
        service: "backend",
    });
});

const port = 3000;

serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0",
});

console.log(`Backend running on http://localhost:${port}`);
