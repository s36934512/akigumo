import { handleArchiveConcept } from "./api/handler.js";
import { archiveConceptProcessor } from "./core/processor/archive-concept.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveConceptProcessor],

    routes: [handleArchiveConcept],
};
