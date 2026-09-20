import type { kernelConfig } from "#app/config/kernel.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import type { Task } from "../task/task.js";

type TaskExecutionIdentity = Pick<
    Task["metadata"],
    "outboxId" | "processingId"
>;

export async function handleFatalError(
    execution: TaskExecutionIdentity,
    errorString: string,
): Promise<void> {
    await prisma.outbox.updateMany({
        where: {
            id: execution.outboxId,
            processingId: execution.processingId,
            status: OutboxStatus.PROCESSING,
        },
        data: {
            status: OutboxStatus.FAILED,
            lastError: errorString,
            scheduledAt: null,
            processingStartedAt: null,
            processingId: null,
        },
    });
}

export async function handleRetryableError(
    execution: TaskExecutionIdentity,
    errorString: string,
    config: typeof kernelConfig,
): Promise<void> {
    await prisma.$executeRaw`
        UPDATE "outbox"
        SET
            attempts = attempts + 1,
            status = CASE
                WHEN attempts + 1 >= ${config.maxAttempts}
                    THEN 'FAILED'::"OutboxStatus"
                ELSE 'PENDING'::"OutboxStatus"
            END,
            last_error = ${errorString},
            scheduled_at = CASE
                WHEN attempts + 1 >= ${config.maxAttempts}
                    THEN NULL
                ELSE NOW() + (
                    power(2::double precision, attempts + 1)
                    * interval '1 minute'
                )
            END,
            processing_started_at = NULL,
            processing_id = NULL,
            updated_at = NOW()
        WHERE id = ${execution.outboxId}
            AND processing_id = ${execution.processingId}::uuid
            AND status = 'PROCESSING'::"OutboxStatus";
    `;
}

export function serializeError(error: unknown): string {
    if (error instanceof Error) {
        return error.stack ?? error.message;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

export function normalizeError(error: unknown): unknown {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    if (typeof error === "object" && error !== null) {
        return error;
    }

    return { message: String(error) };
}
