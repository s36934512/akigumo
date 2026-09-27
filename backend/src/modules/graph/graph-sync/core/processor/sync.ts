import { GraphRefinementRequestSchema } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import type { GraphRefinementQueue } from "../../port/graph-refinement-queue.js";
import { GraphSyncSchema } from "../schema.js";
import type { BaseTask } from "../task.js";

export const GRAPH_INTENT_CREATED = "GRAPH_INTENT_CREATED";

export type GraphSyncTaskResolver = (
    taskName: string,
    payload: unknown,
) => Promise<BaseTask>;

export const createProcessor = (
    graphRefinementQueue: GraphRefinementQueue,
    resolveTask: GraphSyncTaskResolver,
) =>
    defineProcessor(
        GRAPH_INTENT_CREATED,
        GraphSyncSchema.single,
        async (input) => {
            const { taskName, payload } = input.payload;

            const task = await resolveTask(taskName, payload);

            const request = GraphRefinementRequestSchema.parse({
                version: "1.0.0",
                workflowId: input.context.workflowId,
                intentOutboxId: input.metadata.outboxId,
                operation: task.taskType,
                payload: task.payload,
            });

            await graphRefinementQueue.publish(request);
        },
    );
