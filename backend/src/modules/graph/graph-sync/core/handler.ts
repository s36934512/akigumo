import type { z } from "zod";

import type { BaseTask } from "./schema.js";

export interface HandlerDefinition<TSchema extends z.ZodType = z.ZodType> {
    name: string;
    schema: TSchema;
    logic: (data: z.infer<TSchema>) => Promise<BaseTask>;
}

const registry = new Map<string, HandlerDefinition<z.ZodType>>();

const getKey = (name: string): string => name.toLowerCase();

/**
 * Registers a handler for the given aggregate and operation.
 */
export function registerHandler<TSchema extends z.ZodType>(
    handler: HandlerDefinition<TSchema>,
) {
    registry.set(getKey(handler.name), handler);
}

/**
 * Returns the handler configuration for a specific aggregate operation.
 */
export function getHandler<TSchema extends z.ZodType = z.ZodType>(
    name: string,
): HandlerDefinition<TSchema> | undefined {
    const handler = registry.get(getKey(name));
    return handler as HandlerDefinition<TSchema> | undefined;
}
