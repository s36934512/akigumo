import { graphOperationResultProcessor } from "./core/processor/sync.js";

export { GRAPH_OPERATION_RESULT } from "./core/processor/sync.js";

export const capability = {
    processors: [graphOperationResultProcessor],
};
