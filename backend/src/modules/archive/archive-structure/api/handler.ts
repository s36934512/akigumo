import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { getArchiveStructureFromGraph } from "../core/service.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveStructure = app.openapi(route, async (c) => {
    const payload = c.req.valid("json");

    const archiveList = await getArchiveStructureFromGraph({
        parentId: payload.parentId,
        showDeleted: payload.showDeleted,
    });

    return c.json(archiveList, 200);
});
