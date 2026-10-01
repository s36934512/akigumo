import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { WORKFLOW_TYPE } from "../../machine/machine.js";
import { statusRoute } from "../route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveStatus = app.openapi(statusRoute, async (c) => {
    const { workflowId } = c.req.valid("param");

    const result = await prisma.workflowState.findFirst({
        where: {
            id: workflowId,
            workflowType: WORKFLOW_TYPE,
        },
    });

    if (!result) {
        return c.json({ workflowId: workflowId }, 404);
    }

    return c.json({ status: result.status }, 200);
});
