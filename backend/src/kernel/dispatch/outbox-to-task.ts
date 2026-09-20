import { z } from "zod";

import { OutboxModelSchema } from "#generated/zod/schemas/index.js";

import { TASK_VERSION } from "../task/task.js";

/**
 * Converts a persisted Outbox record into a Kernel Task.
 *
 * Outbox is a persistence model, while Task is a Kernel runtime model.
 * They intentionally have different schemas and responsibilities.
 *
 * workflowId is required by the Kernel Task contract. Therefore an
 * Outbox record without workflowId cannot become a valid Kernel Task.
 */
export const OutboxToTaskSchema = OutboxModelSchema.transform((data, ctx) => {
	if (!data.workflowId) {
		ctx.addIssue({
			code: "custom",
			path: ["workflowId"],
			message: "Kernel Task requires workflowId",
		});

		return z.NEVER;
	}

	if (!data.processingId) {
		ctx.addIssue({
			code: "custom",
			path: ["processingId"],
			message: "Kernel Task requires processingId",
		});
		return z.NEVER;
	}

	return {
		metadata: {
			version: TASK_VERSION,
			outboxId: data.id,
			priority: data.priority,
			processingId: data.processingId,
		},
		context: {
			workflowId: data.workflowId,
			operation: data.operation,
		},
		payload: data.payload,
	};
});
