import { defineGraphSyncTask } from "../core/task.js";
import { buildConceptPoolTask, EntrySchema } from "../factory/concept-pair.js";

const PayloadSchema = EntrySchema;

export const conceptPairTask = defineGraphSyncTask({
    name: "concept-pair",
    schema: PayloadSchema,
    execute: async (payload) => {
        const { conceptPool, pairAssociationList } = payload;

        return {
            taskType: "ConceptPairExecutor",
            payload: [
                {
                    conceptPool: conceptPool.map((task) =>
                        buildConceptPoolTask(task),
                    ),
                    taskList: pairAssociationList,
                },
            ],
        };
    },
});
