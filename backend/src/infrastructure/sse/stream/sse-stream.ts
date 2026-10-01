import type { Redis } from "ioredis";

import { SSE_EVENT_STREAM } from "../config.js";

export type SseStreamEntry = {
    streamId: string;
    message: string;
};

export class SseStream {
    constructor(private readonly redis: Redis) {}

    async append(message: string): Promise<string> {
        const streamId = await this.redis.xadd(
            SSE_EVENT_STREAM,
            "MAXLEN",
            "~",
            "10000",
            "*",
            "event",
            message,
        );

        if (!streamId) {
            throw new Error("Redis XADD did not return a stream ID");
        }

        return streamId;
    }

    async readAfter(afterId?: string): Promise<SseStreamEntry[]> {
        const start = afterId ? `(${afterId}` : "-";

        const entries = await this.redis.xrange(SSE_EVENT_STREAM, start, "+");

        return entries.flatMap(([streamId, fields]) => {
            const messageIndex = fields.indexOf("event");

            if (messageIndex < 0) {
                return [];
            }

            const message = fields[messageIndex + 1];

            if (!message) {
                return [];
            }

            return [{ streamId, message }];
        });
    }

    async read(streamId: string): Promise<SseStreamEntry | null> {
        const entries = await this.redis.xrange(
            SSE_EVENT_STREAM,
            streamId,
            streamId,
        );

        const fields = entries[0]?.[1];

        if (!fields) {
            return null;
        }

        const messageIndex = fields.indexOf("event");

        if (messageIndex < 0) {
            return null;
        }

        const message = fields[messageIndex + 1];

        if (!message) {
            return null;
        }

        return {
            streamId,
            message,
        };
    }

    async getFirstId(): Promise<string | null> {
        const entries = await this.redis.xrange(
            SSE_EVENT_STREAM,
            "-",
            "+",
            "COUNT",
            1,
        );

        return entries[0]?.[0] ?? null;
    }

    async getLatestId(): Promise<string | null> {
        const entries = await this.redis.xrevrange(
            SSE_EVENT_STREAM,
            "+",
            "-",
            "COUNT",
            1,
        );

        return entries[0]?.[0] ?? null;
    }

    async isCursorAvailable(afterId: string): Promise<boolean> {
        const firstId = await this.getFirstId();

        if (!firstId) {
            return true;
        }

        return this.compareStreamId(afterId, firstId) >= 0;
    }

    private compareStreamId(a: string, b: string): number {
        const [aTime, aSequence] = a.split("-").map(Number);
        const [bTime, bSequence] = b.split("-").map(Number);

        if (aTime !== bTime) {
            return aTime - bTime;
        }

        return aSequence - bSequence;
    }
}
