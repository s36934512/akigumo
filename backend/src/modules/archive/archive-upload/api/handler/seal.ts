import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { ARCHIVE_SEAL } from "../../core/processor/seal.js";
import { tusSealRoute } from "../route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveSeal = app.openapi(tusSealRoute, async (c) => {
    const payload = c.req.valid("json");

    await prisma.outbox.create({
        data: {
            workflowId: payload.workflowId,
            operation: ARCHIVE_SEAL,
            payload: {
                fileId: payload.fileId,
                notifyId: payload.notifyId,
            },
        },
    });

    return c.json({ workflowId: payload.workflowId }, 200);
});
