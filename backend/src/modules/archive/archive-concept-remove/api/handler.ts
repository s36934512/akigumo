import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";
import { publishWorkflow } from "#app/workflow/index.js";

import { WORKFLOW_TYPE } from "../machine/machine.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveConceptRemove = app.openapi(route, async (c) => {
    const payload = c.req.valid("json");

    const workflowId = await publishWorkflow({
        workflowType: WORKFLOW_TYPE,
        operation: WORKFLOW_BOOTSTRAP,
        payload,
    });

    return c.json({ workflowId }, 202);
});
