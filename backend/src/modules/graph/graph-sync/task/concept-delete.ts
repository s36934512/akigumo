import { z } from "zod";

import { defineGraphSyncTask } from "../core/task.js";

const PayloadSchema = z.uuid().array();

export const conceptDeleteTask = defineGraphSyncTask({
    name: "concept-delete",
    schema: PayloadSchema,
    execute: async (payload) => {
        return {
            taskType: "ConceptDeleteExecutor",
            payload: payload.map((concept) => {
                return {
                    conceptId: concept,
                };
            }),
        };
    },
});
