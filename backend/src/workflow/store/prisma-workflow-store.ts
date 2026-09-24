import type { Prisma, PrismaClient } from "#generated/prisma/client.js";

import type {
    WorkflowState,
    WorkflowStore,
    WorkflowTransaction,
} from "../port/workflow-store.js";

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

class PrismaWorkflowTransaction implements WorkflowTransaction {
    public constructor(private readonly tx: Prisma.TransactionClient) {}

    public async claimWorkflowResult(outboxId: bigint): Promise<boolean> {
        const result = await this.tx.outbox.updateMany({
            where: {
                id: outboxId,
                workflowResultProcessedAt: null,
            },
            data: {
                workflowResultProcessedAt: new Date(),
            },
        });

        return result.count === 1;
    }

    public async findWorkflowState(
        workflowId: string,
    ): Promise<WorkflowState | null> {
        const rowList = await this.tx.$queryRaw<
            Array<{
                id: string;
                workflowType: string;
                data: Prisma.JsonValue | null;
                snapshot: Prisma.JsonValue | null;
            }>
        >`
            SELECT
                id,
                workflow_type  AS "workflowType",
                data,
                snapshot
            FROM "workflow_state"
            WHERE id = ${workflowId}::uuid
            FOR UPDATE
        `;

        const row = rowList[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            workflowType: row.workflowType,
            data: row.data,
            snapshot: row.snapshot,
        };
    }

    public async updateWorkflowState(input: {
        workflowId: string;
        status: string;
        snapshot: unknown;
    }): Promise<void> {
        await this.tx.workflowState.update({
            where: {
                id: input.workflowId,
            },
            data: {
                status: input.status,
                snapshot: toPrismaJson(input.snapshot),
            },
        });
    }

    public async recordWorkflowError(input: {
        workflowId: string;
        error: string;
    }): Promise<void> {
        await this.tx.workflowState.update({
            where: {
                id: input.workflowId,
            },
            data: {
                lastError: input.error,
            },
        });
    }

    public async createOutbox(input: {
        workflowId: string;
        operation: string;
        payload: unknown;
        priority?: number;
        scheduledAt?: Date | null;
    }): Promise<void> {
        await this.tx.outbox.create({
            data: {
                workflowId: input.workflowId,
                operation: input.operation,
                payload: toPrismaJson(input.payload),
                priority: input.priority ?? 10,
                scheduledAt: input.scheduledAt ?? null,
            },
        });
    }
}

export class PrismaWorkflowStore implements WorkflowStore {
    public constructor(private readonly prisma: PrismaClient) {}

    public async transaction<T>(
        callback: (tx: WorkflowTransaction) => Promise<T>,
    ): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            const workflowTransaction = new PrismaWorkflowTransaction(tx);

            return await callback(workflowTransaction);
        });
    }
}
