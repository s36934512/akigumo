import { assign, setup } from "xstate";

import { logger } from "#app/infrastructure/logger/index.js";
import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#app/workflow/index.js";

import {
    ARCHIVE_STORAGE,
    ARCHIVE_TRANSCODE,
    ARCHIVE_UNCOMPRESS,
} from "../core/processor/index.js";
import { actions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_INTEGRATION_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        shouldStartUncompress: ({ context }) => {
            if (!context.strategy.shouldUncompress) return false;
            return context.processingProgress.totalIds.length === 0;
        },

        shouldStartTranscode: ({ context }) => {
            if (!context.strategy.shouldTranscode) return false;
            return context.processingProgress.totalIds.length === 0;
        },

        shouldFailUnhandledEvent,

        isAllFilesDone: ({ context }) => {
            const { totalIds, successIds, failedIds } =
                context.processingProgress;

            return (
                totalIds.length > 0 &&
                successIds.length + failedIds.length === totalIds.length
            );
        },
    },
    actions: {
        handleIntegrationBootstrapSuccess: assign(
            actions.handleIntegrationBootstrapSuccess,
        ),

        handleTranscodeSuccess: assign(actions.handleTranscodeSuccess),

        handleUncompressSuccess: assign(actions.handleUncompressSuccess),

        prepareUncompressTask: assign(({ context }) => {
            return {
                nextIntent: {
                    operation: ARCHIVE_UNCOMPRESS,
                    payload: {
                        fileId: context.fileId,
                        extensionCode: context.extensionCode,
                    },
                },
            };
        }),

        prepareRecursiveUncompressTask: assign(({ context }) => {
            return {
                nextIntent: {
                    operation: ARCHIVE_UNCOMPRESS,
                    payload: {
                        fileId: context.fileId,
                        fileList: context.processingProgress.totalIds,
                        uncompressMaxDepth: context.uncompressMaxDepth - 1,
                    },
                },
            };
        }),

        prepareTranscodeTask: assign(({ context }) => {
            return {
                nextIntent: {
                    operation: ARCHIVE_TRANSCODE,
                    payload: {
                        fileId: context.fileId,
                    },
                },
            };
        }),

        prepareStorageTask: assign(({ context }) => {
            const { fileId, derivedFileId, processingProgress } = context;

            if (!fileId) {
                throw new Error(
                    "ArchiveIntegration workflow invariant violated: fileId is required",
                );
            }

            const fileList = [
                ...processingProgress.totalIds,
                fileId,
                ...(derivedFileId ? [derivedFileId] : []),
            ];

            return {
                nextIntent: {
                    operation: ARCHIVE_STORAGE,
                    payload: {
                        fileId,
                        fileList,
                    },
                },
            };
        }),

        prepareSyncTask: assign(({ context }) => {
            if (context.derivedFileId) {
                return {
                    nextIntent: createSyncIntentOutbox("archive-transcode", {
                        fileId: context.fileId,
                        derivedFileId: context.derivedFileId,
                    }),
                };
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-uncompress", {
                    fileId: context.fileId,
                    derivedFileIds: context.processingProgress.totalIds,
                }),
            };
        }),

        prepareSyncIntentTask: assign(({ context }) => {
            if (context.processingProgress.totalIds.length === 0) {
                return { nextTask: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox(
                    "file-registry",
                    context.processingProgress.totalIds.map((f) => ({
                        fileId: f,
                        itemId: f,
                    })),
                ),
            };
        }),

        handleFailure: assign(actions.handleFailure),

        clearNextIntent: assign({ nextIntent: null }),
    },
}).createMachine({
    id: "processFileItem",
    initial: "BOOTSTRAPPING",
    on: {
        "*": {
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        fileId: null,
        derivedFileId: null,
        extensionCode: null,
        uncompressMaxDepth: 0,
        strategy: {
            shouldUncompress: false,
            shouldTranscode: false,
        },
        processingProgress: {
            totalIds: [],
            successIds: [],
            failedIds: [],
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
                // {
                //     guard: "shouldStartUncompress",
                //     target: "UNCOMPRESSING",
                //     actions: "prepareUncompressTask",
                // },
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

        // UNCOMPRESSING: {
        //     on: {
        //         ARCHIVE_UNCOMPRESS_SUCCEEDED: {
        //             target: "SYNCING_FILE",
        //             actions: ["handleUncompressSuccess", "prepareSyncTask"],
        //         },
        //     },
        // },

        // SYNCING: {
        //     on: {
        //         GRAPH_INTENT_CREATED_SUCCEEDED: {
        //             actions: "clearNextIntent",
        //         },

        //         GRAPH_OPERATION_RESULT_SUCCEEDED: {
        //             target: "WAITING_PROCESSING",
        //             actions: "prepareRecursiveUncompressTask",
        //         },
        //     },
        // },

        // WAITING_PROCESSING: {
        //     on: {
        //         GRAPH_OPERATION_RESULT_SUCCEEDED: {
        //             actions: "clearNextIntent",
        //         },
        //         ARCHIVE_NOTIFY_SUCCESS: [
        //             {
        //                 actions: "completedNotify",
        //             },
        //         ],
        //     },

        //     always: {
        //         guard: "isAllFilesDone",
        //         target: "STORAGE",
        //     },
        // },

        TRANSCODING: {
            on: {
                ARCHIVE_TRANSCODE_SUCCEEDED: {
                    target: "STORAGE",
                    actions: "handleTranscodeSuccess",
                },
            },
        },

        STORAGE: {
            entry: "prepareStorageTask",

            on: {
                ARCHIVE_STORAGE_SUCCEEDED: {
                    target: "SYNCING_FILE",
                    actions: "prepareSyncTask",
                },
            },
        },

        SYNCING_FILE: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    target: "SUCCESS",
                    actions: "clearNextIntent",
                },
            },
        },

        SUCCESS: {
            type: "final",
            entry: "clearNextIntent",
        },

        FAILED: {
            type: "final",
            entry: "clearNextIntent",
        },
    },
});
