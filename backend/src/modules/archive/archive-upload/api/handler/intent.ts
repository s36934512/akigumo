import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { publishWorkflow } from "#app/workflow/index.js";

import { ARCHIVE_INTENT } from "../../core/processor/intent.js";
import { WORKFLOW_TYPE } from "../../machine/machine.js";
import { tusIntentRoute } from "../route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveIntent = app.openapi(tusIntentRoute, async (c) => {
    const payload = c.req.valid("json");

    const workflowId = await publishWorkflow({
        workflowType: WORKFLOW_TYPE,
        operation: ARCHIVE_INTENT,
        payload,
    });

    return c.json({ workflowId }, 202);
});
