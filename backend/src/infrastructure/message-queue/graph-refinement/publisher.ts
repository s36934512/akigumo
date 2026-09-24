import type { GraphRefinementRequest } from "#app/contracts/graph-refinement.js";
import type { RedisStreamProducer } from "#app/infrastructure/redis-stream/index.js";

export class RedisGraphRefinementPublisher {
    constructor(private readonly producer: RedisStreamProducer) {}

    async publish(request: GraphRefinementRequest): Promise<void> {
        await this.producer.publish(JSON.stringify(request));
    }
}
