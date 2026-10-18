import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { publishWorkflow } from "#app/workflow/index.js";

import { ARCHIVE_CONCEPT_PAIR } from "../core/processor/archive-concept-pair.js";
import { WORKFLOW_TYPE } from "../machine/machine.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveConceptPair = app.openapi(route, async (c) => {
    const payload = c.req.valid("json");

    const workflowId = await publishWorkflow({
        workflowType: WORKFLOW_TYPE,
        operation: ARCHIVE_CONCEPT_PAIR,
        payload,
    });

    return c.json({ workflowId }, 202);
});
