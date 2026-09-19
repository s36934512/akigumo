import type z from "zod";

import type { ProcessorDefinition } from "./processor.js";

const registry = new Map<string, ProcessorDefinition<z.ZodType>>();

const getKey = (name: string): string => name;

/**
 * Registers a processor by operation name.
 */
export function registerProcessor<TSchema extends z.ZodType>(
	processor: ProcessorDefinition<TSchema>,
): void {
	const key = getKey(processor.name);

	if (registry.has(key)) {
		throw new Error(
			`[processorRegistry] Processor already registered: ${key}`,
		);
	}

	registry.set(key, processor as ProcessorDefinition<z.ZodType>);
}

/**
 * Gets a processor by operation name.
 */
export function getProcessor<TSchema extends z.ZodType = z.ZodType>(
	name: string,
): ProcessorDefinition<TSchema> | undefined {
	return registry.get(getKey(name)) as
		| ProcessorDefinition<TSchema>
		| undefined;
}
