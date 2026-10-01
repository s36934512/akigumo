import type { Redis } from "ioredis";

import { SSE_EVENT_CHANNEL } from "../config.js";
import { type SseEvent, SseEventSchema } from "../event.js";
import type { SseStream } from "../stream/sse-stream.js";

export class SseEventPublisher {
    constructor(
        private readonly redis: Redis,
        private readonly stream: SseStream,
    ) {}

    async publish(event: SseEvent): Promise<string> {
        const validatedEvent = SseEventSchema.parse(event);
        const message = JSON.stringify(validatedEvent);

        const streamId = await this.stream.append(message);

        await this.redis.publish(SSE_EVENT_CHANNEL, streamId);

        return streamId;
    }
}
