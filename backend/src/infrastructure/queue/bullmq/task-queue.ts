import type { Queue } from "bullmq";

import type { Task } from "#app/kernel/index.js";
import type { KernelTaskQueue } from "#app/kernel/port/task-queue.js";

export class BullMQTaskQueue implements KernelTaskQueue {
    public constructor(private readonly queue: Queue) {}

    public async addBulk(taskList: Task[]): Promise<void> {
        await this.queue.addBulk(
            taskList.map((task) => ({
                name: task.context.operation,
                data: task,
                opts: {
                    priority: task.metadata.priority,
                },
            })),
        );
    }
}
