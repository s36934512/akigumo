import { Queue } from "bullmq";

import { queueConfig } from "#app/config/queue.js";
import { redis } from "#app/infrastructure/redis/redis.js";

import { BullMQTaskQueue } from "./task-queue.js";

export function createBullMQTaskQueue(): BullMQTaskQueue {
    const queue = new Queue(queueConfig.queueName, {
        connection: redis,
    });

    return new BullMQTaskQueue(queue);
}
