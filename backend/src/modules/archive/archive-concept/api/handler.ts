import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { publishWorkflow } from "#app/workflow/index.js";

import { ARCHIVE_CONCEPT } from "../core/processor/archive-concept.js";
import { WORKFLOW_TYPE } from "../machine/machine.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveConcept = app.openapi(route, async (c) => {
    const payload = c.req.valid("json");

    const workflowId = await publishWorkflow({
        workflowType: WORKFLOW_TYPE,
        operation: ARCHIVE_CONCEPT,
        payload,
    });

    return c.json({ workflowId }, 202);
});
