import { handleArchiveConceptPair } from "./api/handler.js";
import { archiveConceptPairProcessor } from "./core/processor/archive-concept-pair.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveConceptPairProcessor],

    routes: [handleArchiveConceptPair],
};
