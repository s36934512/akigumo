import type { Task } from "../task/task.js";

export interface KernelTaskQueue {
	addBulk(taskList: Task[]): Promise<void>;
}
