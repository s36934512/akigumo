import { z } from "@hono/zod-openapi";

import {
    GraphIntentCreatedEvents,
    GraphOperationResultEvents,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import {
    ArchiveIntegrationBootstrapEvents,
    StrategySchema,
} from "../core/processor/dispatch.js";
import {
    ArchiveStorageEvents,
    ArchiveTranscodeEvents,
    ArchiveUncompressEvents,
} from "../core/processor/index.js";

const ProcessingProgressSchema = z.object({
    totalIds: z.uuid().array(),
    successIds: z.uuid().array(),
    failedIds: z.uuid().array(),
});

export const ContextSchema = MachineContextSchema.extend({
    fileId: z.uuid().nullable(),
    extensionCode: z.string().nullable(),
    uncompressMaxDepth: z.int(),
    strategy: StrategySchema,

    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveIntegrationBootstrapEvents.schemaList,
    ...ArchiveStorageEvents.schemaList,
    ...ArchiveTranscodeEvents.schemaList,
    ...ArchiveUncompressEvents.schemaList,
    ...GraphIntentCreatedEvents.schemaList,
    ...GraphOperationResultEvents.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
