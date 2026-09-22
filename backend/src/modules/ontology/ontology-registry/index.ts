import { handleOntologyRegistry } from "./api/handler.js";
import { ontologyRegistryProcessor } from "./core/processor/registry.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [ontologyRegistryProcessor],

    routes: [handleOntologyRegistry],
};
