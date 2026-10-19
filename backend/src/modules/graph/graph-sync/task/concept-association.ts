import { defineGraphSyncTask } from "../core/task.js";
import {
    buildConceptPoolTask,
    EntrySchema,
} from "../factory/concept-association.js";

const PayloadSchema = EntrySchema;

export const conceptAssociationTask = defineGraphSyncTask({
    name: "concept-association",
    schema: PayloadSchema,
    execute: async (payload) => {
        const { conceptPool, associationList } = payload;

        return {
            taskType: "ConceptAssociationExecutor",
            payload: [
                {
                    conceptPool: conceptPool.map((task) =>
                        buildConceptPoolTask(task),
                    ),
                    taskList: associationList,
                },
            ],
        };
    },
});
