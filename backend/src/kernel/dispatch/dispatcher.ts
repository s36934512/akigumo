import { kernelConfig } from "#app/config/kernel.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/pino.js";
import { type Outbox, Prisma } from "#generated/prisma/client.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import type { KernelTaskQueue } from "../port/task-queue.js";
import type { Task } from "../task/task.js";
import { OutboxToTaskSchema } from "./outbox-to-task.js";

/**
 * Atomically claims pending outbox rows so that concurrent dispatchers
 * cannot claim the same row.
 */
async function claimPendingOutboxList(): Promise<Outbox[]> {
    return await prisma.$transaction(async (tx) => {
        const rowList = await tx.$queryRaw<Outbox[]>`
			WITH candidate AS (
				SELECT id
				FROM "outbox"
				WHERE status = 'PENDING'
				AND attempts < ${kernelConfig.maxAttempts}
				AND (
					scheduled_at IS NULL
					OR scheduled_at <= NOW()
				)
				ORDER BY id ASC
				LIMIT 100
				FOR UPDATE SKIP LOCKED
			)

			UPDATE "outbox" AS o
			SET
				status = 'PROCESSING',
				processing_id = uuidv7(),
				processing_started_at = NOW(),
				updated_at = NOW()
			FROM candidate
			WHERE o.id = candidate.id
			RETURNING o.*;
		`;

        return rowList;
    });
}

/**
 * Recovers PROCESSING outbox rows whose processing lease has expired.
 *
 * An expired processing lease means the dispatcher that claimed the row
 * probably stopped before the task was successfully dispatched.
 *
 * Lease expiration consumes one retry attempt.
 */
async function recoverExpiredProcessingLeases(): Promise<void> {
    const timeoutMinutes = kernelConfig.processingLeaseTimeoutMinutes;
    const staleBefore = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const retryResult = await prisma.outbox.updateMany({
        where: {
            status: OutboxStatus.PROCESSING,
            processingStartedAt: {
                lt: staleBefore,
            },
            attempts: {
                lt: kernelConfig.maxAttempts - 1,
            },
        },
        data: {
            status: OutboxStatus.PENDING,
            attempts: {
                increment: 1,
            },
            scheduledAt: new Date(),
            processingStartedAt: null,
            processingId: null,
            lastError: "Processing lease expired",
        },
    });

    const failedResult = await prisma.outbox.updateMany({
        where: {
            status: OutboxStatus.PROCESSING,
            processingStartedAt: {
                lt: staleBefore,
            },
            attempts: {
                gte: kernelConfig.maxAttempts - 1,
            },
        },
        data: {
            status: OutboxStatus.FAILED,
            attempts: {
                increment: 1,
            },
            scheduledAt: null,
            processingStartedAt: null,
            processingId: null,
            lastError: "Processing lease expired and maximum attempts reached",
        },
    });

    const recoveredCount = retryResult.count + failedResult.count;

    if (recoveredCount > 0) {
        logger.warn(
            {
                label: "Dispatcher",
                retryCount: retryResult.count,
                failedCount: failedResult.count,
                staleBefore,
            },
            "Recovered expired processing leases",
        );
    }
}

async function failInvalidOutboxList(outboxList: Outbox[]): Promise<void> {
    if (outboxList.length === 0) {
        return;
    }

    await prisma.$executeRaw`
		UPDATE "outbox" AS o
		SET
			status = 'FAILED',
			processing_started_at = NULL,
			processing_id = NULL,
			last_error = 'Invalid kernel task: failed to transform outbox row',
			updated_at = NOW()
		FROM (
			VALUES
				${Prisma.join(
                    outboxList.map(
                        (outbox) =>
                            Prisma.sql`(${outbox.id}, ${outbox.processingId}::uuid)`,
                    ),
                )}
		) AS outbox(id, processing_id)
		WHERE o.id = outbox.id
			AND o.processing_id = outbox.processing_id;
	`;
}

/**
 * Releases ownership of claimed outbox rows when dispatching to the
 * task queue fails.
 */
async function releaseClaimedOutboxList(outboxList: Outbox[]): Promise<void> {
    if (outboxList.length === 0) {
        return;
    }

    await prisma.$executeRaw`
		UPDATE "outbox" AS o
		SET
			status = 'PENDING',
			processing_started_at = NULL,
			processing_id = NULL,
			updated_at = NOW()
		FROM (
			VALUES
				${Prisma.join(
                    outboxList.map(
                        (outbox) =>
                            Prisma.sql`(${outbox.id}, ${outbox.processingId}::uuid)`,
                    ),
                )}
		) AS outbox(id, processing_id)
		WHERE o.id = outbox.id
			AND o.processing_id = outbox.processing_id;
	`;
}

/**
 * Dispatches pending outbox rows to the Kernel task queue.
 *
 * This is the application-level dispatch use case.
 *
 * It does not know which queue implementation is used.
 */
export async function dispatchPendingOutbox(
    taskQueue: KernelTaskQueue,
): Promise<void> {
    await recoverExpiredProcessingLeases();

    const outboxList = await claimPendingOutboxList();

    if (outboxList.length === 0) {
        return;
    }

    const taskList: Task[] = [];
    const validOutboxList: Outbox[] = [];
    const invalidOutboxList: Outbox[] = [];

    for (const outbox of outboxList) {
        const result = OutboxToTaskSchema.safeParse(outbox);

        if (!result.success) {
            invalidOutboxList.push(outbox);
            continue;
        }

        validOutboxList.push(outbox);
        taskList.push(result.data);
    }

    if (invalidOutboxList.length > 0) {
        await failInvalidOutboxList(invalidOutboxList);
    }

    if (taskList.length === 0) {
        return;
    }

    try {
        await taskQueue.addBulk(taskList);
    } catch (error) {
        await releaseClaimedOutboxList(validOutboxList);
        throw error;
    }
}
