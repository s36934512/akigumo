import { z } from "zod";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveConceptRemoveSchema } from "../api/schema.js";
import { ArchiveConceptRemoveEvent } from "../core/processor/archive-concept-remove.js";

const ContextSchema = MachineContextSchema.extend({
    request: ArchiveConceptRemoveSchema.array.nullable(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveConceptRemoveEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
