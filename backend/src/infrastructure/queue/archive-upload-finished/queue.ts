import type { Queue } from "bullmq";

import type { UploadFinishedQueue } from "#app/infrastructure/queue/port/upload-finished-queue.js";

export class BullMQUploadFinishedQueue implements UploadFinishedQueue {
    public constructor(private readonly queue: Queue) {}

    public async add(message: {
        fileId: string;
        uploadId: string;
    }): Promise<void> {
        const { fileId, uploadId } = message;

        await this.queue.add(
            "upload-finished",
            { fileId, uploadId },
            {
                jobId: `upload-finished-${fileId}`,
            },
        );
    }

    public async close(): Promise<void> {
        await this.queue.close();
    }
}
