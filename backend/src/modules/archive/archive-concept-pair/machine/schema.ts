import { z } from "zod";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveConceptPairEvent } from "../core/processor/archive-concept-pair.js";
import { ArchiveConceptEntrySchema, PoolSchema } from "../core/schema.js";

const ContextSchema = MachineContextSchema.extend({
    pool: PoolSchema.array().optional(),
    entryList: ArchiveConceptEntrySchema.array.optional(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveConceptPairEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
