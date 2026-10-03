import { Queue } from "bullmq";

import { env } from "#app/config/env.js";
import { queueConfig } from "#app/config/queue.js";

import { BullMQUploadFinishedQueue } from "./queue.js";

export function createBullMQUploadFinishedQueue(): BullMQUploadFinishedQueue {
    const queue = new Queue(queueConfig.archiveUploadFinished.queueName, {
        connection: {
            url: env.redis.url,
        },
    });

    return new BullMQUploadFinishedQueue(queue);
}
