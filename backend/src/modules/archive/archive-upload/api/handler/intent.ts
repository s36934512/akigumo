import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { v7 as uuidv7 } from "uuid";

import { ArchiveStatus, ArchiveType } from "#app/generated/prisma/enums.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";

import { hasEnoughSpace } from "../../core/disk-guard.js";
import { WORKFLOW_TYPE } from "../../machine/machine.js";
import { route } from "../route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveIntent = app.openapi(route, async (c) => {
    const { fileList } = c.req.valid("json");

    const totalSize = fileList.reduce(
        (acc, f) => acc + BigInt(f.size),
        BigInt(0),
    );

    if (!(await hasEnoughSpace(Paths.TMP_TUS, Number(totalSize)))) {
        throw new NonRetryableError("磁碟空間不足");
    }

    const workflowId = uuidv7();

    const completeFileList = fileList.map((f) => ({
        id: f.id,
        originalName: f.name,
        size: f.size,
        isOriginal: true,
        ...(f.metadata !== undefined && {
            metadata: f.metadata,
        }),
        createdByWorkflowId: workflowId,
    }));

    const itemList = completeFileList.map((f) => ({
        id: f.id,
        name: f.originalName,
        type: ArchiveType.FILE_CONTAINER,
        status: ArchiveStatus.PROCESSING,
    }));

    await prisma.$transaction([
        prisma.file.createMany({
            data: completeFileList,
        }),

        prisma.archive.createMany({
            data: itemList,
        }),

        prisma.workflowState.create({
            data: {
                id: workflowId,
                workflowType: WORKFLOW_TYPE,
                status: "INIT",
            },
        }),

        prisma.outbox.create({
            data: {
                workflowId,
                operation: WORKFLOW_BOOTSTRAP,
                payload: {
                    fileIdList: fileList.map((f) => f.id),
                },
            },
        }),
    ]);

    return c.json({ workflowId }, 200);
});
