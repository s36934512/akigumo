import {
    type WorkflowResult,
    WorkflowResultSchema,
} from "#app/contracts/index.js";
import type {
    RedisStreamWorker,
    StreamMessage,
} from "#app/infrastructure/redis-stream/index.js";

export class RedisWorkflowResultConsumer {
    constructor(private readonly worker: RedisStreamWorker) {}

    async run(
        handler: (event: WorkflowResult) => Promise<void>,
    ): Promise<void> {
        await this.worker.run(async (messageList: StreamMessage[]) => {
            for (const message of messageList) {
                const result = WorkflowResultSchema.safeParse(message.payload);

                if (!result.success) {
                    throw new Error(
                        `Invalid WorkflowResult message: ${result.error.message}`,
                    );
                }

                await handler(result.data);
            }
        });
    }

    async stop(): Promise<void> {
        await this.worker.stop();
    }
}
