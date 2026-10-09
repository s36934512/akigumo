import { Client } from "pg";

import { kernelConfig } from "#app/config/kernel.js";
import { graphRefinementMqConfig } from "#app/config/message-queue/graph-refinement.js";
import { workflowResultMqConfig } from "#app/config/message-queue/workflow-result.js";
import { postgresConfig } from "#app/config/postgres.js";
import { closeDatabase, prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { createRedisGraphRefinementMq } from "#app/infrastructure/message-queue/graph-refinement/factory.js";
import { GraphRefinementResultWorker } from "#app/infrastructure/message-queue/graph-refinement/handler.js";
import { createRedisWorkflowResultMq } from "#app/infrastructure/message-queue/workflow-result/factory.js";
import { PostgresOutboxListener } from "#app/infrastructure/postgres/outbox-listener.js";
import { createBullMQUploadFinishedQueue } from "#app/infrastructure/queue/archive-upload-finished/factory.js";
import { createArchiveUploadFinishedWorker } from "#app/infrastructure/queue/archive-upload-finished/worker.js";
import { createBullMQTaskQueue } from "#app/infrastructure/queue/bullmq/factory.js";
import { createBullMQWorker } from "#app/infrastructure/queue/bullmq/worker.js";
import { createTusServer } from "#app/infrastructure/tus/tus-server.js";
import {
    createDispatcher,
    createDispatchRuntime,
    registerProcessor,
} from "#app/kernel/index.js";
import { createGraphSyncProcessor } from "#app/modules/graph/graph-sync/index.js";
import { createApp } from "#app/routes.js";
import {
    createWorkflowEngine,
    PrismaWorkflowStore,
} from "#app/workflow/index.js";

import { registerModuleRuntime } from "./register-modules.js";

type BackgroundTask = {
    name: string;
    run: () => Promise<void>;
};

type Cleanup = {
    name: string;
    run: () => Promise<void>;
};

export async function bootstrap(): Promise<{
    app: ReturnType<typeof createApp>;
    stop: () => Promise<void>;
    failure: Promise<unknown>;
}> {
    const cleanup = createCleanupRunner();

    let stopping = false;
    let backgroundFailureReported = false;

    let resolveBackgroundFailure!: (error: unknown) => void;

    const failure = new Promise<unknown>((resolve) => {
        resolveBackgroundFailure = resolve;
    });

    function stop(): Promise<void> {
        stopping = true;
        return cleanup.runCleanup();
    }

    function reportBackgroundFailure(name: string, error: unknown): void {
        if (stopping || backgroundFailureReported) {
            return;
        }

        backgroundFailureReported = true;

        logger.fatal(
            {
                label: "BackgroundTask",
                task: name,
                err: error,
            },
            "背景工作意外終止，應用程式需要停止",
        );

        resolveBackgroundFailure(error);

        // 即使入口層沒有及時處理 failure，也開始回收內部資源。
        // cleanup runner 是 idempotent，入口層可以再次呼叫 stop()。
        void stop().catch((cleanupError: unknown) => {
            logger.error(
                {
                    label: "Shutdown",
                    err: cleanupError,
                },
                "背景工作失敗後，部分資源未能正常關閉",
            );
        });
    }

    function superviseBackgroundTask(task: BackgroundTask): void {
        let taskPromise: Promise<void>;

        try {
            taskPromise = task.run();
        } catch (error: unknown) {
            reportBackgroundFailure(task.name, error);
            return;
        }

        void taskPromise.then(
            () => {
                if (stopping) {
                    return;
                }

                reportBackgroundFailure(
                    task.name,
                    new Error(
                        `Background task "${task.name}" exited unexpectedly`,
                    ),
                );
            },
            (error: unknown) => {
                reportBackgroundFailure(task.name, error);
            },
        );
    }

    try {
        cleanup.register("database", closeDatabase);

        // Register module runtime capabilities before creating workers.
        registerModuleRuntime();

        // Infrastructure
        const postgresListenerClient = new Client({
            connectionString: postgresConfig.connectionString,
        });
        cleanup.register("postgresListenerClient", () =>
            postgresListenerClient.end(),
        );

        await postgresListenerClient.connect();

        const taskQueue = createBullMQTaskQueue();
        cleanup.register("taskQueue", () => taskQueue.close());

        const uploadFinishedQueue = createBullMQUploadFinishedQueue();
        cleanup.register("uploadFinishedQueue", () =>
            uploadFinishedQueue.close(),
        );

        const workflowResultMq = createRedisWorkflowResultMq(
            workflowResultMqConfig,
        );
        cleanup.register("workflowResultMq", () => workflowResultMq.stop());

        const graphRefinementMq = createRedisGraphRefinementMq(
            graphRefinementMqConfig,
        );
        cleanup.register("graphRefinementMq", () => graphRefinementMq.stop());

        // Kernel
        const dispatch = createDispatcher({
            taskQueue,
            config: kernelConfig,
        });

        const dispatchRuntime = createDispatchRuntime(dispatch, {
            pollIntervalMs: kernelConfig.dispatchPollIntervalMs,
        });

        // Workflow
        const workflowStore = new PrismaWorkflowStore(prisma);
        const workflowEngine = createWorkflowEngine(workflowStore);

        // Workers
        const taskWorker = createBullMQWorker(workflowResultMq.publisher);
        cleanup.register("taskWorker", () => taskWorker.close());

        const archiveUploadFinishedWorker = createArchiveUploadFinishedWorker();
        cleanup.register("archiveUploadFinishedWorker", () =>
            archiveUploadFinishedWorker.close(),
        );

        const graphRefinementWorker = new GraphRefinementResultWorker(
            graphRefinementMq.consumer,
        );
        cleanup.register("graphRefinementWorker", () =>
            graphRefinementWorker.stop(),
        );

        // Dispatch Runtime
        // Register after workers so LIFO shutdown stops it before the workers.
        cleanup.register("dispatchRuntime", () => dispatchRuntime.stop());

        // Listeners
        const outboxListener = new PostgresOutboxListener(
            postgresListenerClient,
        );
        cleanup.register("outboxListener", () => outboxListener.stop());

        const tusServer = createTusServer(uploadFinishedQueue);

        const app = createApp(tusServer);

        // Start
        const graphSyncProcessor = createGraphSyncProcessor(
            graphRefinementMq.publisher,
        );

        registerProcessor(graphSyncProcessor);

        // Start long-running background tasks under supervision.
        superviseBackgroundTask({
            name: "graphRefinementWorker",
            run: () => graphRefinementWorker.run(),
        });

        superviseBackgroundTask({
            name: "workflowResultConsumer",
            run: () => workflowResultMq.consumer.run(workflowEngine),
        });

        dispatchRuntime.start();

        await outboxListener.start(dispatchRuntime.requestDispatch);

        if (backgroundFailureReported) {
            await stop();

            throw new Error("背景工作在應用程式啟動期間意外終止");
        }

        logger.info({ label: "Kernel" }, "秋雲 Akigumo 系統內核已完全啟動");

        return {
            app,
            stop,
            failure,
        };
    } catch (startupError: unknown) {
        stopping = true;

        try {
            await cleanup.runCleanup();
        } catch (cleanupError: unknown) {
            throw new AggregateError(
                [startupError, cleanupError],
                "應用程式啟動失敗，且部分資源清理失敗",
            );
        }

        throw startupError;
    }
}

function createCleanupRunner() {
    const cleanupList: Cleanup[] = [];

    let cleanupPromise: Promise<void> | undefined;

    function register(name: string, run: () => Promise<void>): void {
        cleanupList.push({ name, run });
    }

    function runCleanup(): Promise<void> {
        if (cleanupPromise) {
            return cleanupPromise;
        }

        cleanupPromise = (async () => {
            const errorList: unknown[] = [];

            for (const cleanup of [...cleanupList].reverse()) {
                try {
                    logger.info(
                        { label: "Shutdown", resource: cleanup.name },
                        "開始清理資源",
                    );

                    await cleanup.run();

                    logger.info(
                        { label: "Shutdown", resource: cleanup.name },
                        "資源清理完成",
                    );
                } catch (error: unknown) {
                    errorList.push(error);

                    logger.error(
                        {
                            label: "Shutdown",
                            resource: cleanup.name,
                            err: error,
                        },
                        "資源清理失敗，繼續清理其他資源",
                    );
                }
            }

            if (errorList.length > 0) {
                throw new AggregateError(errorList, "部分資源未能正常關閉");
            }
        })();

        return cleanupPromise;
    }

    return { register, runCleanup };
}
