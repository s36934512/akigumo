import { handleOntologyDelete } from "./api/handler.js";
import { ontologyDeleteProcessor } from "./core/processor/delete.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [ontologyDeleteProcessor],

    routes: [handleOntologyDelete],
};
