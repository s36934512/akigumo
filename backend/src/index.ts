import { serve } from "@hono/node-server";

import { bootstrap } from "./app/bootstrap.js";
import { logger } from "./infrastructure/logger/index.js";
import app from "./routes.js";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const runtime = await bootstrap();

const server = serve({
    fetch: app.fetch,
    port: 3000,
    hostname: "0.0.0.0",
});

logger.info({ label: "Akigumo" }, "Core Modules Loaded");

const shutdown = async () => {
    server.close();
    await runtime.stop();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
