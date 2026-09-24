import {
    type GraphOperationResult,
    GraphOperationResultSchema,
} from "#app/contracts/graph-refinement.js";
import type {
    RedisStreamWorker,
    StreamMessage,
} from "#app/infrastructure/redis-stream/index.js";

export class RedisGraphRefinementConsumer {
    constructor(private readonly worker: RedisStreamWorker) {}

    async run(
        handler: (result: GraphOperationResult) => Promise<void>,
    ): Promise<void> {
        await this.worker.run(async (message: StreamMessage) => {
            const result = GraphOperationResultSchema.safeParse(
                message.payload,
            );

            if (!result.success) {
                throw new Error(
                    `Invalid PythonJobResult message: ${result.error.message}`,
                );
            }

            await handler(result.data);
        });
    }

    async stop(): Promise<void> {
        await this.worker.stop();
    }
}
