import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import fs from "fs-extra";
import { stream } from "hono/streaming";

import { archiveServeProcessor } from "../core/processor.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveServe = app.openapi(route, async (c) => {
    const { fileId } = c.req.valid("param");

    const result = await archiveServeProcessor(fileId);

    if (!result) {
        return c.json({ error: "File not accessible" }, 404);
    }

    return stream(c, async (stream) => {
        c.header("Content-Type", result.mimeType);
        c.header("Cache-Control", "max-age=86400, immutable");

        const fileStream = fs.createReadStream(result.filePath);

        stream.onAbort(() => {
            fileStream.destroy();
        });

        for await (const chunk of fileStream) {
            await stream.write(chunk);
        }
    });
});
