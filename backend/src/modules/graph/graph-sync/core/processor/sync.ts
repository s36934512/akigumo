import { GraphRefinementRequestSchema } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import type { GraphRefinementQueue } from "../../port/graph-refinement-queue.js";
import { getHandler } from "../handler.js";
import { GraphSyncSchema } from "../schema.js";

export const GRAPH_INTENT_CREATED = "GRAPH_INTENT_CREATED";

export const createGraphSyncProcessor = (
    graphRefinementQueue: GraphRefinementQueue,
) =>
    defineProcessor(
        GRAPH_INTENT_CREATED,
        GraphSyncSchema.single,
        async (input) => {
            const { handlerName, payload } = input.payload;

            const handler = getHandler(handlerName);
            if (!handler) {
                throw new Error(`Handler for task '${handlerName}' not found`);
            }

            const task = await handler.logic(handler.schema.parse(payload));
            const request = GraphRefinementRequestSchema.parse({
                version: "1.0.0",
                workflowId: input.context.workflowId,
                intentOutboxId: input.context.sourceOutboxId,
                operation: task.taskType,
                payload: task.payload,
            });

            await graphRefinementQueue.publish(request);
        },
    );
