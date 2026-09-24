import { v7 as uuidv7 } from "uuid";

import type { Prisma } from "#app/generated/prisma/client.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

interface PublishWorkflowOptions<P extends Prisma.InputJsonValue> {
    workflowType: string;
    operation: string;
    payload: P;
}

interface PublishOperationOptions<P extends Prisma.InputJsonValue> {
    workflowId: string;
    operation: string;
    payload: P;
}

export async function publishWorkflow<P extends Prisma.InputJsonValue>(
    options: PublishWorkflowOptions<P>,
): Promise<string> {
    const workflowId = uuidv7();

    await prisma.$transaction([
        prisma.workflowState.create({
            data: {
                id: workflowId,
                workflowType: options.workflowType,
                status: "INIT",
            },
        }),

        prisma.outbox.create({
            data: {
                workflowId,
                operation: options.operation,
                payload: options.payload,
            },
        }),
    ]);

    return workflowId;
}

export async function publishOperation<P extends Prisma.InputJsonValue>(
    options: PublishOperationOptions<P>,
): Promise<void> {
    await prisma.outbox.create({
        data: {
            workflowId: options.workflowId,
            operation: options.operation,
            payload: options.payload,
        },
    });
}
