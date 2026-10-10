import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Server } from "@tus/server";
import { logger } from "hono/logger";

import { registerModules } from "./app/register-modules.js";
import { sseHandler } from "./infrastructure/sse/index.js";

export function createApp(tusServer: Server) {
    const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath(
        "/api/v1",
    );

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

    app.route("/", sseHandler);

    registerModules(app);

    return app;
}
