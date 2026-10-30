import type { Prisma } from "#app/generated/prisma/client.js";
import type {
    SearchSyncEntityType,
    SearchSyncOperation,
} from "#app/generated/prisma/enums.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

const MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;

const STALE_TIMEOUT_MS = 10 * 60 * 1_000;

type ProcessingIdentity = {
    id: bigint;
    processingId: string;
};

type ClaimBatchInput = {
    limit: number;
};

type RetryInput = ProcessingIdentity;

type RecoverStaleInput = {
    timeoutMs?: number;
};

export type EnqueueSearchSyncInput = {
    entityType: SearchSyncEntityType;
    entityId: string;
    operation: SearchSyncOperation;
};

export type ClaimedSearchSyncOutbox = {
    id: bigint;
    entityType: SearchSyncEntityType;
    entityId: string;
    operation: SearchSyncOperation;
    attempts: number;
    processingId: string;
    processingStartedAt: Date;
    scheduledAt: Date;
    createdAt: Date;
};

export async function claimBatch({
    limit,
}: ClaimBatchInput): Promise<ClaimedSearchSyncOutbox[]> {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
        throw new Error("limit must be a positive safe integer");
    }

    return prisma.$queryRaw<ClaimedSearchSyncOutbox[]>`
        WITH candidate AS (
            SELECT current.id
            FROM search_sync_outbox AS current
            WHERE
                current.status = 'PENDING'
                AND current.scheduled_at <= NOW()

                AND NOT EXISTS (
                    SELECT 1
                    FROM search_sync_outbox AS processing
                    WHERE
                        processing.entity_type = current.entity_type
                        AND processing.entity_id = current.entity_id
                        AND processing.status = 'PROCESSING'
                )

                AND NOT EXISTS (
                    SELECT 1
                    FROM search_sync_outbox AS earlier
                    WHERE
                        earlier.entity_type = current.entity_type
                        AND earlier.entity_id = current.entity_id
                        AND earlier.status = 'PENDING'
                        AND (
                            earlier.created_at,
                            earlier.id
                        ) < (
                            current.created_at,
                            current.id
                        )
                )

            ORDER BY
                current.scheduled_at ASC,
                current.created_at ASC,
                current.id ASC

            LIMIT ${limit}
            FOR UPDATE OF current SKIP LOCKED
        )
        UPDATE search_sync_outbox AS outbox
        SET
            status = 'PROCESSING',
            processing_id = gen_random_uuid(),
            processing_started_at = NOW(),
            attempts = outbox.attempts + 1,
            updated_at = NOW()
        FROM candidate
        WHERE
            outbox.id = candidate.id
            AND outbox.status = 'PENDING'
        RETURNING
            outbox.id,
            outbox.entity_type AS "entityType",
            outbox.entity_id AS "entityId",
            outbox.operation,
            outbox.attempts,
            outbox.processing_id AS "processingId",
            outbox.processing_started_at AS "processingStartedAt",
            outbox.scheduled_at AS "scheduledAt",
            outbox.created_at AS "createdAt"
    `;
}

export async function complete({
    id,
    processingId,
}: ProcessingIdentity): Promise<boolean> {
    const result = await prisma.searchSyncOutbox.updateMany({
        where: {
            id,
            status: "PROCESSING",
            processingId,
        },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            processingId: null,
            processingStartedAt: null,
        },
    });

    return result.count === 1;
}

export async function retry({
    id,
    processingId,
}: RetryInput): Promise<"RETRY" | "FAILED" | "LOST"> {
    const result = await prisma.$queryRaw<{ status: "PENDING" | "FAILED" }[]>`
        UPDATE search_sync_outbox
        SET
            status = CASE
                WHEN attempts >= ${MAX_ATTEMPTS}
                    THEN 'FAILED'::"OutboxStatus"
                ELSE 'PENDING'::"OutboxStatus"
            END,
            scheduled_at = CASE
                WHEN attempts >= ${MAX_ATTEMPTS}
                    THEN scheduled_at
                ELSE NOW() + (
                    INTERVAL '1 millisecond'
                    * LEAST(
                        ${BASE_RETRY_DELAY_MS}
                            * POWER(2, attempts - 1),
                        ${MAX_RETRY_DELAY_MS}
                    )
                )
            END,
            processing_id = NULL,
            processing_started_at = NULL,
            updated_at = NOW()
        WHERE
            id = ${id}
            AND status = 'PROCESSING'
            AND processing_id = ${processingId}
        RETURNING status;
    `;

    if (result.length === 0) {
        return "LOST";
    }

    return result[0].status === "FAILED" ? "FAILED" : "RETRY";
}

export async function recoverStale({
    timeoutMs = STALE_TIMEOUT_MS,
}: RecoverStaleInput = {}): Promise<number> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        throw new Error("timeoutMs must be a positive safe integer");
    }

    const staleBefore = new Date(Date.now() - timeoutMs);

    const result = await prisma.searchSyncOutbox.updateMany({
        where: {
            status: "PROCESSING",
            processingStartedAt: {
                lt: staleBefore,
            },
        },
        data: {
            status: "PENDING",
            scheduledAt: new Date(),
            processingId: null,
            processingStartedAt: null,
        },
    });

    return result.count;
}

export async function enqueue(
    tx: Prisma.TransactionClient,
    input: EnqueueSearchSyncInput,
): Promise<void> {
    await tx.searchSyncOutbox.create({
        data: {
            entityType: input.entityType,
            entityId: input.entityId,
            operation: input.operation,
        },
    });
}

export async function enqueueBatch(
    tx: Prisma.TransactionClient,
    inputList: EnqueueSearchSyncInput[],
): Promise<void> {
    if (inputList.length === 0) {
        return;
    }

    await tx.searchSyncOutbox.createMany({
        data: inputList,
    });
}
