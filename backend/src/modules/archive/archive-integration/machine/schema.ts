/**
 * @file State machine context and event schemas for process-file-item workflow
 * Defines persisted context shape and event contract for item-level file processing
 */
import { z } from "@hono/zod-openapi";
import {
    GraphIntentCreatedEvents,
    PythonEvents,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import {
    ArchiveDispatchEvents,
    ArchiveStorageEvents,
    ArchiveTranscodeEvents,
    ArchiveUncompressEvents,
} from "../core/processor/index.js";

const StrategySchema = z.object({
    shouldUncompress: z.boolean(),
    shouldTranscode: z.boolean(),
});

const ProcessingProgressSchema = z.object({
    totalIds: z.uuid().array(),
    successIds: z.uuid().array(),
    failedIds: z.uuid().array(),
});

export const ContextSchema = MachineContextSchema.extend({
    fileId: z.uuid().nullable(),
    notifyId: z.uuid().nullable(),
    extensionCode: z.string().nullable(),
    conceptId: z.uuid().nullable(),
    uncompressMaxDepth: z.number(),
    strategy: StrategySchema,

    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveDispatchEvents.schemaList,
    ...ArchiveStorageEvents.schemaList,
    ...ArchiveTranscodeEvents.schemaList,
    ...ArchiveUncompressEvents.schemaList,
    ...GraphIntentCreatedEvents.schemaList,
    ...PythonEvents.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
