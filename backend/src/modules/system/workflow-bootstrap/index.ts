import { workflowBootstrapProcessor } from "./processor.js";

export { WORKFLOW_BOOTSTRAP } from "./processor.js";

export const capability = {
    processors: [workflowBootstrapProcessor],
};
