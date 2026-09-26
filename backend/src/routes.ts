import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import { registerModules } from "./app/register-modules.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath("/api/v1");

app.use("*", logger());

app.doc("/doc", {
    // Expose the OpenAPI JSON document
    openapi: "3.1.0",
    info: { title: "My API", version: "1.0.0" },
});

// app.all("/tus/files/:fileId?", async (c) => {
//     const method = c.req.method;
//     let targetId = c.req.param("fileId");

//     if (method === "POST") {
//         // 從 Metadata Header 抓出 ID (Base64 解碼)
//         const metadata = c.req.header("upload-metadata") || "";
//         const match = metadata.match(/fileId\s+([^,]+)/);
//         if (match) targetId = atob(match[1]);
//     }

//     console.log(`[Tus] ${method} Target ID: ${targetId || "New"}`);
//     return await tusServer.handleWeb(c.req.raw);
// });

// app.route("/", sseHandler);

registerModules(app);

export default app;
