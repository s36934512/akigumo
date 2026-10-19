import { z } from "zod";
import { defineGraphSyncTask } from "../core/task.js";

const payloadSchema = z.object({
    request: z
        .object({
            targetId: z.uuid(),
            conceptIdList: z.uuid().array(),
        })
        .array(),
});

export const conceptAssociationRemoveTask = defineGraphSyncTask({
    name: "concept-association-remove",
    schema: payloadSchema,
    execute: async (payload) => {
        const { request } = payload;

        return {
            taskType: "ConceptAssociationRemoveExecutor",
            payload: request,
        };
    },
});
