import { Queue } from "bullmq";

import { env } from "#app/config/env.js";
import { queueConfig } from "#app/config/queue.js";

import { BullMQTaskQueue } from "./task-queue.js";

export function createBullMQTaskQueue(): BullMQTaskQueue {
    const queue = new Queue(queueConfig.queueName, {
        connection: {
            url: env.redis.url,
        },
    });

    return new BullMQTaskQueue(queue);
}
