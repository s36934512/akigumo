import { z } from "zod";

import {
    GraphIntentCreatedEvents,
    GraphOperationResultEvents,
} from "#app/contracts/index.js";

import { MachineContextSchema } from "#app/workflow/index.js";
import { OntologyRegistryEvents } from "../core/index.js";

const ContextSchema = MachineContextSchema.extend({
    notifyId: z.uuid().nullable(),
    idList: z.uuid().array(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...OntologyRegistryEvents.schemaList,
    ...GraphIntentCreatedEvents.schemaList,
    ...GraphOperationResultEvents.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
