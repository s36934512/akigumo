import { handleArchiveRestore } from "./api/handler.js";
import { archiveRestoreProcessor } from "./core/processor/restore.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveRestoreProcessor],

    routes: [handleArchiveRestore],
};
