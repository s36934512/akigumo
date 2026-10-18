import { handleOntologyPair } from "./api/handler.js";
import { ontologyPairProcessor } from "./core/processor/pair.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [ontologyPairProcessor],

    routes: [handleOntologyPair],
};
