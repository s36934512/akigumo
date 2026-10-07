import {
    archiveDispatchProcessor,
    archiveStorageProcessor,
    archiveTranscodeProcessor,
    archiveUncompressProcessor,
} from "./core/processor/index.js";

import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export {
    ARCHIVE_DISPATCH,
    ArchiveDispatchEvents,
} from "./core/processor/dispatch.js";

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
