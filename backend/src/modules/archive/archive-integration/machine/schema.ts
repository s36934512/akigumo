import { z } from "@hono/zod-openapi";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import {
    ArchiveIntegrationBootstrapEvent,
    StrategySchema,
} from "../core/processor/dispatch.js";
import {
    ArchiveStorageEvent,
    ArchiveTranscodeEvent,
    ArchiveUncompressEvent,
} from "../core/processor/index.js";

const ProcessingProgressSchema = z.object({
    totalIds: z.uuid().array(),
    successIds: z.uuid().array(),
    failedIds: z.uuid().array(),
});

export const ContextSchema = MachineContextSchema.extend({
    fileId: z.uuid().nullable(),
    derivedFileId: z.uuid().nullable(),
    extensionCode: z.string().nullable(),
    uncompressMaxDepth: z.int(),
    strategy: StrategySchema,

    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveIntegrationBootstrapEvent.schemaList,
    ...ArchiveStorageEvent.schemaList,
    ...ArchiveTranscodeEvent.schemaList,
    ...ArchiveUncompressEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
