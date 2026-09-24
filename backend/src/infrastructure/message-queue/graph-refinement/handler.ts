import type { GraphOperationResult } from "#app/contracts/graph-refinement.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { GRAPH_OPERATION_RESULT } from "#app/modules/graph/graph-result/index.js";
import type { OutboxCreateInput } from "#generated/prisma/models.js";

import type { RedisGraphRefinementConsumer } from "./consumer.js";

export class GraphRefinementResultWorker {
    constructor(private readonly consumer: RedisGraphRefinementConsumer) {}

    async run(): Promise<void> {
        await this.consumer.run(async (result: GraphOperationResult) => {
            const outbox = this.toGraphResultProcessorOutbox(result);

            await prisma.outbox.create({ data: outbox });
        });
    }

    async stop(): Promise<void> {
        await this.consumer.stop();
    }

    private toGraphResultProcessorOutbox(
        result: GraphOperationResult,
    ): OutboxCreateInput {
        return {
            workflowId: result.workflowId,
            sourceOutboxId: result.intentOutboxId,
            operation: GRAPH_OPERATION_RESULT,
            payload: JSON.parse(JSON.stringify(result.result)),
        };
    }
}
