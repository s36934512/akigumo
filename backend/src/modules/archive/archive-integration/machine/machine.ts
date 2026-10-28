import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { uniqueArray } from "#app/utils/array.js";

import { ARCHIVE_DISPATCH } from "../core/processor/dispatch.js";
import {
    ARCHIVE_FINALIZE_STORAGE,
    ARCHIVE_NOTIFY,
    ARCHIVE_TRANSCODE,
    ARCHIVE_UNCOMPRESS,
} from "../core/processor/index.js";
import { actions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

function isProcessingComplete(context: MachineContext): boolean {
    const { extractedFileIdList, childResultByFileId } =
        context.processingProgress;

    if (extractedFileIdList.length === 0) {
        return false;
    }

    return extractedFileIdList.every(
        (id) => childResultByFileId[id] !== undefined,
    );
}

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },

    guards: {
        shouldStartUncompress: ({ context }) =>
            context.strategy.shouldUncompress &&
            context.remainingUncompressDepth > 0,

        shouldStartTranscode: ({ context }) => context.strategy.shouldTranscode,

        isAllFilesDone: ({ context }) => isProcessingComplete(context),

        hasDiscoveredFiles: ({ context }) =>
            context.processingProgress.extractedFileIdList.length > 0,

        hasDerivedFile: ({ context }) => context.transcodedFileId !== null,

        notifyParentOnCompletion: ({ context }) => !!context.parentWorkflowId,
    },

    actions: {
        handleIntegrationBootstrapSuccess: assign(
            actions.handleBootstrapSucceeded,
        ),

        handleTranscodeSucceeded: assign(actions.handleTranscodeSucceeded),

        handleUncompressSucceeded: assign(actions.handleUncompressSucceeded),

        handleChildCompletionReported: assign(
            actions.handleChildCompletionReported,
        ),

        handleFailure: assign(actions.handleFailure),

        prepareChildUncompressDispatch: assign(({ context }) => {
            if (!context.currentFileId) {
                throw new Error(
                    "ArchiveIntegration invariant violated: fileId is required",
                );
            }

            return {
                nextIntent: {
                    operation: ARCHIVE_UNCOMPRESS,
                    payload: {
                        fileId: context.currentFileId,
                    },
                },
            };
        }),

        prepareRecursiveUncompressTask: assign(({ context }) => {
            const fileIdList = uniqueArray(
                context.processingProgress.extractedFileIdList,
            );

            if (fileIdList.length === 0) {
                return {
                    nextIntent: null,
                };
            }

            return {
                nextIntent: {
                    operation: ARCHIVE_DISPATCH,
                    payload: {
                        fileIdList,
                        remainingUncompressDepth:
                            context.remainingUncompressDepth - 1,
                        notifyParentOnCompletion: true,
                    },
                },
            };
        }),

        prepareTranscodeTask: assign(({ context }) => {
            if (!context.currentFileId) {
                throw new Error(
                    "ArchiveIntegration invariant violated: fileId is required",
                );
            }

            return {
                nextIntent: {
                    operation: ARCHIVE_TRANSCODE,
                    payload: {
                        fileId: context.currentFileId,
                    },
                },
            };
        }),

        prepareStorageTask: assign(({ context }) => {
            if (!context.currentFileId) {
                throw new Error(
                    "ArchiveIntegration invariant violated: fileId is required",
                );
            }

            const fileList = uniqueArray([
                ...context.processingProgress.extractedFileIdList,
                context.currentFileId,
                ...(context.transcodedFileId ? [context.transcodedFileId] : []),
            ]);

            return {
                nextIntent: {
                    operation: ARCHIVE_FINALIZE_STORAGE,
                    payload: {
                        fileId: context.currentFileId,
                        fileList,
                    },
                },
            };
        }),

        prepareUncompressSyncTask: assign(({ context }) => {
            if (!context.currentFileId) {
                throw new Error(
                    "ArchiveIntegration invariant violated: fileId is required",
                );
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-uncompress", {
                    fileId: context.currentFileId,
                    derivedFileIdList: uniqueArray(
                        context.processingProgress.extractedFileIdList,
                    ),
                }),
            };
        }),

        prepareTranscodeSyncTask: assign(({ context }) => {
            if (!context.currentFileId || !context.transcodedFileId) {
                throw new Error(
                    "ArchiveIntegration invariant violated: " +
                        "fileId and derivedFileId are required",
                );
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-transcode", {
                    fileId: context.currentFileId,
                    derivedFileId: context.transcodedFileId,
                }),
            };
        }),

        prepareNotify: assign(({ context }) => ({
            nextIntent: {
                operation: ARCHIVE_NOTIFY,
                payload: {
                    fileId: context.currentFileId,
                    succeeded: true,
                    parentWorkflowId: context.parentWorkflowId,
                },
            },
        })),

        prepareFailedNotify: assign(({ context }) => ({
            nextIntent: {
                operation: ARCHIVE_NOTIFY,
                payload: {
                    fileId: context.currentFileId,
                    succeeded: false,
                    parentWorkflowId: context.parentWorkflowId,
                },
            },
        })),

        clearNextIntent: assign({
            nextIntent: null,
        }),
    },
}).createMachine({
    id: "processFileItem",
    initial: "BOOTSTRAPPING",

    on: {
        "*": {
            target: ".FAILED_NOTIFY",
            actions: "handleFailure",
        },
    },

    context: {
        currentFileId: null,
        transcodedFileId: null,
        parentWorkflowId: null,

        remainingUncompressDepth: 0,

        strategy: {
            shouldUncompress: false,
            shouldTranscode: false,
        },

        processingProgress: {
            extractedFileIdList: [],
            childResultByFileId: {},
        },

        nextIntent: null,
        error: null,
    },

    states: {
        BOOTSTRAPPING: {
            on: {
                WORKFLOW_BOOTSTRAP_SUCCEEDED: {
                    target: "DECIDING_PROCESS",
                    actions: "handleIntegrationBootstrapSuccess",
                },
            },
        },

        DECIDING_PROCESS: {
            always: [
                {
                    guard: "shouldStartUncompress",
                    target: "UNCOMPRESSING",
                    actions: "prepareChildUncompressDispatch",
                },
                {
                    guard: "shouldStartTranscode",
                    target: "TRANSCODING",
                    actions: "prepareTranscodeTask",
                },
                {
                    target: "STORAGE",
                },
            ],
        },

        UNCOMPRESSING: {
            on: {
                ARCHIVE_UNCOMPRESS_SUCCEEDED: {
                    target: "WAITING_PROCESSING",
                    actions: [
                        "handleUncompressSucceeded",
                        "prepareUncompressSyncTask",
                    ],
                },
            },
        },

        WAITING_PROCESSING: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    actions: "prepareRecursiveUncompressTask",
                },

                ARCHIVE_DISPATCH_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                ARCHIVE_CHILD_COMPLETION_REPORTED_SUCCEEDED: {
                    actions: "handleChildCompletionReported",
                },
            },

            always: {
                guard: "isAllFilesDone",
                target: "STORAGE",
            },
        },

        TRANSCODING: {
            on: {
                ARCHIVE_TRANSCODE_SUCCEEDED: {
                    target: "STORAGE",
                    actions: "handleTranscodeSucceeded",
                },
            },
        },

        STORAGE: {
            entry: "prepareStorageTask",

            on: {
                ARCHIVE_FINALIZE_STORAGE_SUCCEEDED: [
                    {
                        guard: "hasDerivedFile",
                        actions: "prepareTranscodeSyncTask",
                        target: "SYNCING_FILE",
                    },
                    {
                        target: "NOTIFY",
                    },
                ],
            },
        },

        SYNCING_FILE: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    target: "NOTIFY",
                },
            },
        },

        NOTIFY: {
            always: [
                {
                    guard: "notifyParentOnCompletion",
                    target: "SENDING",
                },
                {
                    target: "SUCCESS",
                },
            ],
        },

        SENDING: {
            entry: "prepareNotify",

            on: {
                ARCHIVE_NOTIFY_SUCCEEDED: {
                    target: "SUCCESS",
                },
            },
        },

        SUCCESS: {
            type: "final",
            entry: "clearNextIntent",
        },

        FAILED_NOTIFY: {
            entry: "prepareFailedNotify",

            on: {
                ARCHIVE_NOTIFY_SUCCEEDED: {
                    target: "FAILED",
                },

                ARCHIVE_NOTIFY_FAILED: {
                    target: "FAILED",
                },
            },
        },

        FAILED: {
            type: "final",
            entry: "clearNextIntent",
        },
    },
});
