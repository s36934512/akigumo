import type { z } from "zod";

import type { Task } from "../task/task.js";

/**
 * Defines how a Kernel operation is executed.
 *
 * inputSchema validates the processor-specific payload.
 */
export interface ProcessorDefinition<TSchema extends z.ZodType = z.ZodType> {
    name: string;
    inputSchema: TSchema;
    logic: (task: Task<z.output<TSchema>>) => Promise<unknown>;
}

export function defineProcessor<TInput extends z.ZodType, TResult>(
    action: string,
    inputSchema: TInput,
    logic: (task: Task<z.infer<TInput>>) => Promise<TResult>,
): ProcessorDefinition<TInput> {
    return {
        name: action,
        inputSchema,
        logic,
    };
}
