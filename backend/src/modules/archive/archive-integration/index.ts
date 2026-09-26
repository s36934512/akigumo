import {
    archiveDispatchProcessor,
    archiveStorageProcessor,
    archiveTranscodeProcessor,
    archiveUncompressProcessor,
} from "./core/processor/index.js";

import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [
        archiveStorageProcessor,
        archiveDispatchProcessor,
        archiveTranscodeProcessor,
        archiveUncompressProcessor,
    ],
};
