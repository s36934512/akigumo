import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { publishWorkflow } from "#app/workflow/index.js";

import { ONTOLOGY_ASSOCIATION } from "../core/processor/association.js";
import { WORKFLOW_TYPE } from "../machine/machine.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleOntologyAssociation = app.openapi(route, async (c) => {
    const payload = c.req.valid("json");

    const workflowId = await publishWorkflow({
        workflowType: WORKFLOW_TYPE,
        operation: ONTOLOGY_ASSOCIATION,
        payload,
    });

    return c.json({ workflowId }, 202);
});
