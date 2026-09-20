import { Client } from "pg";

import { kernelConfig } from "#app/config/kernel.js";
import { postgresConfig } from "#app/config/postgres.js";
import { PostgresOutboxListener } from "#app/infrastructure/postgres/outbox-listener.js";
import { createBullMQTaskQueue } from "#app/infrastructure/queue/bullmq/factory.js";
import { createDispatcher, createDispatchRuntime } from "#app/kernel/index.js";

export async function bootstrap(): Promise<void> {
    const postgresListenerClient = new Client({
        connectionString: postgresConfig.connectionString,
    });

    await postgresListenerClient.connect();

    const taskQueue = createBullMQTaskQueue();

    const dispatch = createDispatcher({
        taskQueue,
        config: kernelConfig,
    });

    const dispatchRuntime = createDispatchRuntime(dispatch);

    const outboxListener = new PostgresOutboxListener(postgresListenerClient);

    await outboxListener.start(dispatchRuntime.requestDispatch);
}
