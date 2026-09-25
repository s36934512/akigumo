import { handleArchiveDelete } from "./api/handler.js";
import { archiveDeleteProcessor } from "./core/processor/delete.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveDeleteProcessor],

    routes: [handleArchiveDelete],
};
