import {
    createProcessor,
    GRAPH_INTENT_CREATED,
} from "./core/processor/sync.js";
import type { GraphRefinementQueue } from "./port/graph-refinement-queue.js";
import { archiveConceptTask } from "./task/archive-concept.js";
import { archiveDeleteTask } from "./task/archive-delete.js";
import { archiveTranscodeTask } from "./task/archive-transcode.js";
import { archiveUncompressTask } from "./task/archive-uncompress.js";
import { conceptDeleteTask } from "./task/concept-delete.js";
import { conceptRegistryTask } from "./task/concept-registry.js";
import { fileRegistryTask } from "./task/file-registry.js";
import { itemContainTask } from "./task/item-contain.js";

const taskList = [
    archiveConceptTask,
    archiveDeleteTask,
    archiveTranscodeTask,
    archiveUncompressTask,
    conceptDeleteTask,
    conceptRegistryTask,
    fileRegistryTask,
    itemContainTask,
];

const taskMap = new Map(taskList.map((task) => [task.name, task.execute]));

export function createGraphSyncProcessor(
    graphRefinementQueue: GraphRefinementQueue,
) {
    return createProcessor(graphRefinementQueue, async (taskName, payload) => {
        const execute = taskMap.get(taskName);
        if (!execute) {
            throw new Error(`Task ${taskName} not found`);
        }
        return execute(payload);
    });
}

export function createSyncIntentOutbox(taskName: string, payload: unknown) {
    return {
        operation: GRAPH_INTENT_CREATED,
        payload: {
            taskName,
            payload,
        },
    };
}
