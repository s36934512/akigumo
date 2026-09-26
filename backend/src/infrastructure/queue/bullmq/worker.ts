import { type Job, Worker } from "bullmq";
import { z } from "zod";

import { env } from "#app/config/env.js";
import { queueConfig } from "#app/config/queue.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { executeKernelTask } from "#app/kernel/execution/executor.js";
import { handleFatalError } from "#app/kernel/execution/failure.js";
import { getProcessor } from "#app/kernel/execution/processor-registry.js";
import { TaskSchema } from "#app/kernel/index.js";
import type { WorkflowResultPublisher } from "#app/kernel/port/workflow-result-publisher.js";

const TaskMetadataIdentitySchema = z.object({
    outboxId: z.coerce.bigint(),
    processingId: z.uuid(),
});

const InvalidTaskEnvelopeSchema = z.object({
    metadata: TaskMetadataIdentitySchema,
});

function extractTaskExecutionIdentity(data: unknown) {
    const result = InvalidTaskEnvelopeSchema.safeParse(data);

    if (!result.success) {
        return undefined;
    }

    return result.data.metadata;
}

export function createBullMQWorker(publisher: WorkflowResultPublisher): Worker {
    return new Worker(
        queueConfig.queueName,
        async (job: Job) => {
            const result = TaskSchema.safeParse(job.data);

            if (!result.success) {
                const execution = extractTaskExecutionIdentity(job.data);

                if (execution !== undefined) {
                    await handleFatalError(
                        execution,
                        `Invalid kernel task: ${result.error.message}`,
                    );
                }

                logger.error(
                    {
                        label: "KernelWorker",
                        jobId: job.id,
                        outboxId: execution?.outboxId.toString(),
                    },
                    "Kernel Task 格式錯誤",
                );

                return;
            }

            const task = result.data;
            const processor = getProcessor(task.context.operation);

            if (!processor) {
                await handleFatalError(
                    task.metadata,
                    `未找到對應的處理器: ${task.context.operation}`,
                );

                return;
            }

            await executeKernelTask(processor, task, publisher);
        },
        {
            connection: {
                url: env.redis.url,
            },
            concurrency: queueConfig.workerConcurrency,
        },
    );
}
