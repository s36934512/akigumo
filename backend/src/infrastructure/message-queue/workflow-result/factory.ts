import { createRedisClient } from "#app/infrastructure/redis/redis.js";
import {
    RedisStreamProducer,
    RedisStreamWorker,
} from "#app/infrastructure/redis-stream/index.js";

import { RedisWorkflowResultConsumer } from "./consumer.js";
import { RedisWorkflowResultPublisher } from "./publisher.js";

type WorkflowResultMqConfig = {
    streamName: string;
    consumerGroup: string;
    batchSize: number;
    minIdleTime: number;
    trimIntervalSeconds: number;
};

export function createRedisWorkflowResultMq(config: WorkflowResultMqConfig) {
    const producerRedis = createRedisClient();
    const consumerRedis = createRedisClient();

    const producer = new RedisStreamProducer({
        producerRedis,
        streamName: config.streamName,
    });

    const worker = new RedisStreamWorker({
        consumerRedis,
        streamName: config.streamName,
        consumerGroup: config.consumerGroup,
        batchSize: config.batchSize,
        minIdleTime: config.minIdleTime,
        trimIntervalSeconds: config.trimIntervalSeconds,
    });

    return {
        publisher: new RedisWorkflowResultPublisher(producer),
        consumer: new RedisWorkflowResultConsumer(worker),
    };
}
