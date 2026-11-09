import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { ontologyRelationshipProcessor } from "../core/processors.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleOntologyRelationship = app.openapi(route, async (c) => {
    const body = c.req.valid("json");

    const result = await ontologyRelationshipProcessor(body);

    return c.json(result, 200);
});
