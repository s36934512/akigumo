import type {
    SearchSyncEntityType,
    SearchSyncOperation,
} from "#app/generated/prisma/enums.js";
import * as SearchSyncOutboxRepository from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 1_000;
const RECOVER_INTERVAL_MS = 60_000;
const STALE_TIMEOUT_MS = 5 * 60_000;

export type SearchSyncRecord = {
    id: bigint;
    entityType: SearchSyncEntityType;
    entityId: string;
    operation: SearchSyncOperation;
    processingId: string;
};

export type SearchSyncWorkerOptions = {
    sync: (record: SearchSyncRecord) => Promise<void>;
    logger: {
        error: (obj: object, message: string) => void;
        warn: (obj: object, message: string) => void;
    };
};

export class SearchSyncWorker {
    private stopped = true;
    private runningPromise: Promise<void> | null = null;

    constructor(private readonly options: SearchSyncWorkerOptions) {}

    start(): void {
        if (this.runningPromise) return;

        this.stopped = false;
        this.runningPromise = this.run();
    }

    run(): Promise<void> {
        if (this.runningPromise) {
            return this.runningPromise;
        }

        this.stopped = false;

        this.runningPromise = this.runLoop().finally(() => {
            this.runningPromise = null;
        });

        return this.runningPromise;
    }

    async stop(): Promise<void> {
        this.stopped = true;
        await this.runningPromise;
    }

    private async runLoop(): Promise<void> {
        let lastRecoverAt = 0;

        while (!this.stopped) {
            try {
                const now = Date.now();

                if (now - lastRecoverAt >= RECOVER_INTERVAL_MS) {
                    await SearchSyncOutboxRepository.recoverStale({
                        timeoutMs: STALE_TIMEOUT_MS,
                    });

                    lastRecoverAt = Date.now();
                }

                const recordList = await SearchSyncOutboxRepository.claimBatch({
                    limit: BATCH_SIZE,
                });

                if (recordList.length === 0) {
                    await this.sleep(POLL_INTERVAL_MS);
                    continue;
                }

                await Promise.all(
                    recordList.map((record) => this.process(record)),
                );
            } catch (error) {
                this.options.logger.error(
                    { err: error },
                    "Search sync worker iteration failed",
                );

                await this.sleep(POLL_INTERVAL_MS);
            }
        }
    }

    private async process(record: SearchSyncRecord): Promise<void> {
        try {
            await this.options.sync(record);

            const completed = await SearchSyncOutboxRepository.complete({
                id: record.id,
                processingId: record.processingId,
            });

            if (!completed) {
                this.options.logger.warn(
                    {
                        id: record.id.toString(),
                        entityType: record.entityType,
                        entityId: record.entityId,
                    },
                    "Search sync task ownership lost before completion",
                );
            }
        } catch (error) {
            this.options.logger.error(
                {
                    error,
                    id: record.id.toString(),
                    entityType: record.entityType,
                    entityId: record.entityId,
                    operation: record.operation,
                },
                "Search sync task failed",
            );

            try {
                const result = await SearchSyncOutboxRepository.retry({
                    id: record.id,
                    processingId: record.processingId,
                });

                if (result === "LOST") {
                    this.options.logger.warn(
                        { id: record.id.toString() },
                        "Search sync task ownership lost before retry",
                    );
                }
            } catch (retryError) {
                this.options.logger.error(
                    {
                        error: retryError,
                        id: record.id.toString(),
                    },
                    "Failed to retry search sync task",
                );
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
