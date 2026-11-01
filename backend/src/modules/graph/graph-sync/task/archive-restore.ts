import { z } from "zod";

import { defineGraphSyncTask } from "../core/task.js";

const PayloadSchema = z.uuid().array();

export const archiveRestoreTask = defineGraphSyncTask({
    name: "archive-restore",
    schema: PayloadSchema,
    execute: async (payload) => {
        return {
            taskType: "ArchiveRestoreExecutor",
            payload: payload.map((id) => {
                return {
                    archiveId: id,
                };
            }),
        };
    },
});
