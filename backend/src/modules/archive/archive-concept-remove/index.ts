import { handleArchiveConceptRemove } from "./api/handler.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    routes: [handleArchiveConceptRemove],
};
