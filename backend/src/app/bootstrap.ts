import { Client } from "pg";

import { kernelConfig } from "#app/config/kernel.js";
import { graphRefinementMqConfig } from "#app/config/message-queue/graph-refinement.js";
import { workflowResultMqConfig } from "#app/config/message-queue/workflow-result.js";
import { postgresConfig } from "#app/config/postgres.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
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

export async function bootstrap(): Promise<{
    app: ReturnType<typeof createApp>;
    stop: () => Promise<void>;
}> {
    // Register module runtime capabilities before creating workers.
    registerModuleRuntime();

    // Infrastructure
    const postgresListenerClient = new Client({
        connectionString: postgresConfig.connectionString,
    });
    await postgresListenerClient.connect();

    const taskQueue = createBullMQTaskQueue();

    const uploadFinishedQueue = createBullMQUploadFinishedQueue();

    const workflowResultMq = createRedisWorkflowResultMq(
        workflowResultMqConfig,
    );

    const graphRefinementMq = createRedisGraphRefinementMq(
        graphRefinementMqConfig,
    );

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
    const archiveUploadFinishedWorker = createArchiveUploadFinishedWorker();

    const graphRefinementWorker = new GraphRefinementResultWorker(
        graphRefinementMq.consumer,
    );

    // Listeners
    const outboxListener = new PostgresOutboxListener(postgresListenerClient);

    const tusServer = createTusServer(uploadFinishedQueue);

    const app = createApp(tusServer);

    // Start
    void graphRefinementWorker.run();
    void workflowResultMq.consumer.run(workflowEngine);

    const graphSyncProcessor = createGraphSyncProcessor(
        graphRefinementMq.publisher,
    );

    registerProcessor(graphSyncProcessor);

    dispatchRuntime.start();
    await outboxListener.start(dispatchRuntime.requestDispatch);

    logger.info({ label: "Kernel" }, "秋雲 Akigumo 系統內核已完全啟動");

    return {
        app,
        stop: async () => {
            await outboxListener.stop();
            await dispatchRuntime.stop();
            await workflowResultMq.stop();
            await graphRefinementMq.stop();
            await taskQueue.close();
            await uploadFinishedQueue.close();
            await taskWorker.close();
            await archiveUploadFinishedWorker.close();
            await graphRefinementWorker.stop();
            await postgresListenerClient.end();
        },
    };
}
