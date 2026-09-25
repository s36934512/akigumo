import { z } from "zod";

import {
    GraphIntentCreatedEvents,
    PythonEvents,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveConceptEvents } from "../core/processor/archive-concept.js";
import { ArchiveConceptEntrySchema, PoolSchema } from "../core/schema.js";

const ContextSchema = MachineContextSchema.extend({
    pool: PoolSchema.array().optional(),
    entryList: ArchiveConceptEntrySchema.array.optional(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveConceptEvents.schemaList,
    ...GraphIntentCreatedEvents.schemaList,
    ...PythonEvents.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
