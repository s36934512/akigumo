import { handleArchiveIntent } from "./api/handler/intent.js";
import { archiveUploadFinishedProcessor } from "./core/processor/upload-finished.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveUploadFinishedProcessor],

    routes: [handleArchiveIntent],
};
