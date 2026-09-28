import { GraphOperationResultPayloadSchema } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

export const GRAPH_OPERATION_RESULT = "GRAPH_OPERATION_RESULT";

export const graphOperationResultProcessor = defineProcessor(
    GRAPH_OPERATION_RESULT,
    GraphOperationResultPayloadSchema,
    async (input) => {
        return input.payload;
    },
);
