import { z } from "zod";

import {
    defineEventContract,
    GraphIntentCreatedEvent,
    GraphOperationResultEvent,
} from "#app/contracts/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";
import { MachineContextSchema } from "#app/workflow/index.js";

import { ArchiveDispatchEvent } from "../../archive-integration/index.js";
import { ArchiveUploadFinishedEvent } from "../core/processor/upload-finished.js";

export const ArchiveIntentEvent = defineEventContract(WORKFLOW_BOOTSTRAP, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            fileIdList: z.uuid().array(),
        }),
    },
]);

const ProcessingProgressSchema = z.object({
    uploadedIdList: z.uuid().array(),
    pendingDispatchIdList: z.uuid().array(),
    dispatchedIdList: z.uuid().array(),
});

const ContextSchema = MachineContextSchema.extend({
    fileList: z.uuid().array(),
    graphSyncCompleted: z.boolean(),
    processingProgress: ProcessingProgressSchema,
});

export type MachineContext = z.infer<typeof ContextSchema>;

export const EVENT_SCHEMA_LIST = [
    ...ArchiveIntentEvent.schemaList,
    ...ArchiveUploadFinishedEvent.schemaList,
    ...GraphIntentCreatedEvent.schemaList,
    ...GraphOperationResultEvent.schemaList,
    ...ArchiveDispatchEvent.schemaList,
] as const;

export const EventsSchema = z.discriminatedUnion("type", EVENT_SCHEMA_LIST);

export type MachineEvents = z.infer<typeof EventsSchema>;
