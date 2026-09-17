import type { Redis } from "ioredis";

export interface RedisStreamProducerConfig {
    producerRedis: Redis;
    streamName: string;
}

export interface RedisStreamWorkerConfig {
    consumerRedis: Redis;
    streamName: string;
    consumerGroup: string;
    batchSize: number;
    minIdleTime: number;
    trimIntervalSeconds: number;
}
