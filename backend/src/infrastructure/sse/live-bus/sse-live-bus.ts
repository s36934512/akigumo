import type { Redis } from "ioredis";

import { createSubscriber } from "#app/infrastructure/redis/redis.js";

import { SSE_EVENT_CHANNEL } from "../config.js";

export type SseLiveHandler = (streamId: string) => void;

export class SseLiveBus {
    private readonly subscriber: Redis;
    private readonly handlers = new Set<SseLiveHandler>();

    private subscribed = false;
    private closed = false;

    constructor() {
        this.subscriber = createSubscriber();

        this.subscriber.on("message", (channel, message) => {
            if (channel !== SSE_EVENT_CHANNEL || this.closed) {
                return;
            }

            for (const handler of this.handlers) {
                handler(message);
            }
        });
    }

    async connect(): Promise<void> {
        if (this.closed) {
            throw new Error("SseLiveBus is already closed");
        }

        if (this.subscribed) {
            return;
        }

        await this.subscriber.subscribe(SSE_EVENT_CHANNEL);

        this.subscribed = true;
    }

    onMessage(handler: SseLiveHandler): () => void {
        if (this.closed) {
            throw new Error("SseLiveBus is already closed");
        }

        this.handlers.add(handler);

        return () => {
            this.handlers.delete(handler);
        };
    }

    async close(): Promise<void> {
        if (this.closed) {
            return;
        }

        this.closed = true;
        this.handlers.clear();

        try {
            if (this.subscribed) {
                await this.subscriber.unsubscribe(SSE_EVENT_CHANNEL);
                this.subscribed = false;
            }
        } finally {
            await this.subscriber.quit();
        }
    }
}
