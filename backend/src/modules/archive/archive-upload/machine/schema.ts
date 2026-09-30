import { z } from "zod";

import {
    GraphIntentCreatedEvents,
    GraphOperationResultEvents,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveIntentEvents } from "../core/processor/intent.js";
import { ArchiveSealEvents } from "../core/processor/seal.js";

const ProcessingProgressSchema = z.object({
    totalIdList: z.array(z.uuid()),
    successIdList: z.array(z.uuid()),
});

const ContextSchema = MachineContextSchema.extend({
    notifyId: z.uuid().nullable(),
    batchId: z.uuid().nullable(),
    fileList: z.uuid().array(),
    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveIntentEvents.schemaList,
    ...ArchiveSealEvents.schemaList,
    ...GraphIntentCreatedEvents.schemaList,
    ...GraphOperationResultEvents.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
