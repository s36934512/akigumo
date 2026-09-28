import { GraphOperationResultPayloadSchema } from "#app/contracts/index.js";
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

        return result;
    },
);
