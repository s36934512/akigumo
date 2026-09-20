import type { Redis } from "ioredis";

import type { RedisStreamProducerConfig } from "./types/redis-stream.js";

export class RedisStreamProducer {
    protected readonly producerRedis: Redis;
    protected readonly streamName: string;

    constructor(input: RedisStreamProducerConfig) {
        this.producerRedis = input.producerRedis;
        this.streamName = input.streamName;
    }

    /**
     * 將 payload 新增到 Redis Stream。
     *
     * Producer 只負責 XADD，
     * 不需要知道 Consumer Group 或 Consumer。
     */
    public async publish(payload: string): Promise<string> {
        const id = await this.producerRedis.xadd(
            this.streamName,
            "*",
            "payload",
            payload,
        );

        if (id === null) {
            throw new Error(
                `Failed to add message to Redis Stream: ${this.streamName}`,
            );
        }

        return id;
    }

    /**
     * 關閉 Producer 使用的 Redis connection。
     */
    public async close(): Promise<void> {
        await this.producerRedis.quit();
    }
}
