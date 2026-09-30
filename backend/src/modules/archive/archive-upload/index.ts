import { handleArchiveIntent } from "./api/handler/intent.js";
import { handleArchiveSeal } from "./api/handler/seal.js";
import { archiveIntentProcessor } from "./core/processor/intent.js";
import { archiveSealProcessor } from "./core/processor/seal.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [archiveIntentProcessor, archiveSealProcessor],

    routes: [handleArchiveIntent, handleArchiveSeal],
};
