import { z } from "zod";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveDeleteEvent } from "../core/processor/delete.js";

const ContextSchema = MachineContextSchema.extend({
    archiveIdList: z.uuid().array().nullable(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveDeleteEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
