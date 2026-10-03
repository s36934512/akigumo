import { type Job, Worker } from "bullmq";
import { z } from "zod";

import { env } from "#app/config/env.js";
import { queueConfig } from "#app/config/queue.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { ARCHIVE_UPLOAD_FINISHED } from "#app/modules/archive/archive-upload/core/processor/upload-finished.js";

const UploadFinishedJobSchema = z.object({
    fileId: z.uuid(),
});

export function createArchiveUploadFinishedWorker(): Worker {
    return new Worker(
        queueConfig.archiveUploadFinished.queueName,
        async (job: Job) => {
            const result = UploadFinishedJobSchema.safeParse(job.data);

            if (!result.success) {
                throw new Error(
                    `Invalid archive upload finished job: ${result.error.message}`,
                );
            }

            const { fileId } = result.data;

            const record = await prisma.file.findUnique({
                where: {
                    id: fileId,
                },
                select: {
                    createdByWorkflowId: true,
                },
            });

            if (!record) {
                throw new Error(`File with ID ${fileId} not found`);
            }

            await prisma.outbox.create({
                data: {
                    workflowId: record.createdByWorkflowId,
                    operation: ARCHIVE_UPLOAD_FINISHED,
                    payload: {
                        fileId,
                    },
                },
            });
        },
        {
            connection: {
                url: env.redis.url,
            },
        },
    );
}
