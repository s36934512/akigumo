import { z } from "zod";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import {
    ArchiveNotifyBootstrapEvent,
    ArchiveNotifyEvent,
    ArchiveStorageEvent,
    ArchiveTranscodeEvent,
    ArchiveUncompressEvent,
} from "../core/processor/index.js";
import { ArchiveIntegrationBootstrapEvent, StrategySchema } from "./events.js";

const ChildResultSchema = z.enum(["SUCCESS", "FAILURE"]);
export type ChildResult = z.infer<typeof ChildResultSchema>;

const ProcessingProgressSchema = z.object({
    extractedFileIdList: z.uuid().array(),
    childResultByFileId: z.record(z.uuid(), ChildResultSchema),
});

export const ContextSchema = MachineContextSchema.extend({
    currentFileId: z.uuid().nullable(),
    transcodedFileId: z.uuid().nullable(),
    parentWorkflowId: z.uuid().nullable(),

    remainingUncompressDepth: z.int().nonnegative(),

    strategy: StrategySchema,

    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveIntegrationBootstrapEvent.schemaList,
    ...ArchiveNotifyBootstrapEvent.schemaList,
    ...ArchiveNotifyEvent.schemaList,
    ...ArchiveStorageEvent.schemaList,
    ...ArchiveTranscodeEvent.schemaList,
    ...ArchiveUncompressEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
