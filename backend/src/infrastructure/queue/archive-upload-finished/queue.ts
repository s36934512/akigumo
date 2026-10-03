import type { Queue } from "bullmq";

import type { UploadFinishedQueue } from "#app/infrastructure/queue/port/upload-finished-queue.js";

export class BullMQUploadFinishedQueue implements UploadFinishedQueue {
    public constructor(private readonly queue: Queue) {}

    public async add(fileId: string): Promise<void> {
        await this.queue.add(
            "upload-finished",
            { fileId },
            {
                jobId: `upload-finished:${fileId}`,
            },
        );
    }

    public async close(): Promise<void> {
        await this.queue.close();
    }
}
