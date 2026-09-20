import type { WorkflowResult } from "#app/contracts/index.js";
import type { WorkflowResultPublisher } from "#app/kernel/port/workflow-result-publisher.js";
import type { RedisStreamProducer } from "../../redis-stream/index.js";

export class RedisWorkflowResultPublisher implements WorkflowResultPublisher {
    constructor(private readonly producer: RedisStreamProducer) {}

    async publish(event: WorkflowResult): Promise<void> {
        await this.producer.publish(JSON.stringify(event));
    }
}
