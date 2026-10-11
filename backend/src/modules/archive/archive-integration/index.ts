import {
    archiveDispatchProcessor,
    archiveStorageProcessor,
    archiveTranscodeProcessor,
    archiveUncompressProcessor,
} from "./core/processor/index.js";
import { machine } from "./machine/machine.js";
import { WORKFLOW_TYPE } from "./workflow.js";

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
