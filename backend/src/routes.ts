import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import { registerModules } from "./app/register-modules.js";
import { tusServer } from "./infrastructure/tus/tus-server.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath("/api/v1");

app.use("*", logger());

app.doc("/doc", {
    // Expose the OpenAPI JSON document
    openapi: "3.1.0",
    info: { title: "My API", version: "1.0.0" },
});

app.all("/tus/files", async (c) => {
    return await tusServer.handleWeb(c.req.raw);
});

app.all("/tus/files/:fileId", async (c) => {
    return await tusServer.handleWeb(c.req.raw);
});

// app.route("/", sseHandler);

registerModules(app);

export default app;
