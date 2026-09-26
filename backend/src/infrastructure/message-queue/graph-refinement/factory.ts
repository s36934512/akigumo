import { createRedisClient } from "#app/infrastructure/redis/redis.js";
import {
    RedisStreamProducer,
    RedisStreamWorker,
} from "#app/infrastructure/redis-stream/index.js";

import { RedisGraphRefinementConsumer } from "./consumer.js";
import { RedisGraphRefinementPublisher } from "./publisher.js";

type GraphRefinementMqConfig = {
    requestStreamName: string;
    resultStreamName: string;
    consumerGroup: string;
    batchSize: number;
    minIdleTime: number;
    trimIntervalSeconds: number;
};

export function createRedisGraphRefinementMq(config: GraphRefinementMqConfig) {
    const producerRedis = createRedisClient();
    const consumerRedis = createRedisClient();

    const producer = new RedisStreamProducer({
        producerRedis,
        streamName: config.requestStreamName,
    });

    const worker = new RedisStreamWorker({
        consumerRedis,
        streamName: config.resultStreamName,
        consumerGroup: config.consumerGroup,
        batchSize: config.batchSize,
        minIdleTime: config.minIdleTime,
        trimIntervalSeconds: config.trimIntervalSeconds,
    });

    return {
        publisher: new RedisGraphRefinementPublisher(producer),
        consumer: new RedisGraphRefinementConsumer(worker),

        stop: async () => {
            await worker.stop();
            await producer.close();
        },
    };
}
