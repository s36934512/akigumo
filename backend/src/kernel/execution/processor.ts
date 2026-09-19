import type z from "zod";

import type { Task } from "../task/task.js";

/**
 * Defines how a Kernel operation is executed.
 *
 * inputSchema validates the processor-specific payload.
 */
export interface ProcessorDefinition<TSchema extends z.ZodType = z.ZodType> {
	name: string;
	inputSchema: TSchema;
	onBefore?: (task: Task<z.output<TSchema>>) => Promise<void> | void;
	logic: (task: Task<z.output<TSchema>>) => Promise<unknown>;
}
