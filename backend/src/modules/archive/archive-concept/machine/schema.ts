import { z } from "zod";

import {
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveConceptEvent } from "../core/processor/archive-concept.js";
import {
    ConceptAssociationSchema,
    ConceptRegistryWithIdSchema,
} from "../core/schema.js";

const ContextSchema = MachineContextSchema.extend({
    conceptPool: ConceptRegistryWithIdSchema.array().nullable(),
    associationList: ConceptAssociationSchema.array.nullable(),
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveConceptEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
