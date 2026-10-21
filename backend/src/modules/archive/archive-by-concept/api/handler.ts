import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { getArchiveByConcept } from "../core/service.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveByConcept = app.openapi(route, async (c) => {
    const { conceptId } = c.req.valid("param");

    const archiveList = await getArchiveByConcept(conceptId);

    return c.json(archiveList, 200);
});
