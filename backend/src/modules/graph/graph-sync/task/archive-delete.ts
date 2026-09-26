import { z } from "zod";

import { defineGraphSyncTask } from "../core/task.js";

const PayloadSchema = z.uuid().array();

export const archiveDeleteTask = defineGraphSyncTask({
    name: "archive-delete",
    schema: PayloadSchema,
    execute: async (payload) => {
        return {
            taskType: "ArchiveDeleteExecutor",
            payload: payload.map((id) => {
                return {
                    archiveId: id,
                };
            }),
        };
    },
});
