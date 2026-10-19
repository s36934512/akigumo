import { GraphOperationResultPayloadSchema } from "#app/contracts/index.js";
import { sseEventPublisher } from "#app/infrastructure/sse/index.js";
import { defineProcessor, NonRetryableError } from "#app/kernel/index.js";

export const GRAPH_OPERATION_RESULT = "GRAPH_OPERATION_RESULT";

export const graphOperationResultProcessor = defineProcessor(
    GRAPH_OPERATION_RESULT,
    GraphOperationResultPayloadSchema,
    async (input) => {
        const result = input.payload;

        if (result.status === "FAILURE") {
            throw new NonRetryableError(result.error.message, result.error);
        }

        await sseEventPublisher.publish({
            timestamp: Date.now(),
            type: "GRAPH_CHANGED",
            payload: {},
        });

        return result;
    },
);
