import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { getArchiveById } from "../core/service.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveById = app.openapi(route, async (c) => {
    const { archiveId } = c.req.valid("param");

    const archive = await getArchiveById(archiveId);

    if (!archive) {
        return c.body(null, 404);
    }

    return c.json(archive, 200);
});
