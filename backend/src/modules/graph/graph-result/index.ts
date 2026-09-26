import { graphOperationResultProcessor } from "./core/processor/result.js";

export { GRAPH_OPERATION_RESULT } from "./core/processor/result.js";

export const capability = {
    processors: [graphOperationResultProcessor],
};
