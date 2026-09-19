import { z } from "zod";

/**
 * Kernel Task protocol version.
 *
 * This version describes the runtime message format between
 * the dispatcher and kernel worker.
 */
export const TASK_VERSION = "1.0.0" as const;

/**
 * Metadata required by the Kernel to execute a Task.
 *
 * These fields describe the Task itself, not the processor payload.
 */
const TaskMetadataSchema = z.object({
	version: z.literal(TASK_VERSION),
	outboxId: z.coerce.bigint(),
	priority: z.number(),
	processingId: z.uuid(),
});

/**
 * Runtime context required by a Kernel Task.
 *
 * A Kernel Task always belongs to a Workflow because the processor
 * result must be delivered back to the Workflow Engine.
 */
const TaskContextSchema = z.object({
	workflowId: z.uuid(),
	operation: z.string(),
});

/**
 * Kernel Task message.
 *
 * The payload remains unknown at this level. The registered processor
 * is responsible for validating its own payload.
 */
export const TaskSchema = z.object({
	metadata: TaskMetadataSchema,
	context: TaskContextSchema,
	payload: z.unknown(),
});

export type Task<TPayload = unknown> = Omit<
	z.infer<typeof TaskSchema>,
	"payload"
> & {
	payload: TPayload;
};
