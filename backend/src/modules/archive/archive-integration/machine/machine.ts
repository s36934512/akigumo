/**
 * @file State machine definition for file-integration child workflow
 *
 * Each file item runs its own instance of this machine so one slow or failed
 * item cannot block the rest of the batch. The machine drives a linear
 * DECIDING_PROCESS branch that routes to archive extraction, image
 * transcoding, or direct graph-sync depending on the strategy flags set by
 * the SEAL processor.
 */

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
                successIds.length + failedIds.length + 1 === totalIds.length
            );
        },
    },
    actions: {
        handleDispatchSuccess: assign(actions.handleDispatchSuccess),

        handleTranscodeSuccess: assign(actions.handleTranscodeSuccess),

        handleUncompressSuccess: assign(actions.handleUncompressSuccess),

        /**
         * Archive extraction must precede graph sync
         *
         * Graph labels and child-file metadata cannot be determined until the
         * archive contents are known, so extraction always runs before sync.
         */
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

        /**
         * Derived WebP assets must exist before the node is considered complete
         *
         * The source image alone cannot fulfill display requirements; at least
         * one transcoded derivative must be produced before graph sync runs.
         */
        prepareTranscodeTask: assign(({ context }) => {
            return {
                nextIntent: {
                    operation: ARCHIVE_TRANSCODE,
                    payload: {
                        id: context.fileId,
                    },
                },
            };
        }),

        prepareStorageTask: assign(({ context }) => {
            return {
                nextIntent: {
                    operation: ARCHIVE_STORAGE,
                    payload: {
                        fileId: context.fileId,
                        fileList: context.processingProgress.totalIds,
                    },
                },
            };
        }),

        /**
         * Schedule a Neo4j MERGE for the completed file node
         *
         * Sync runs before notifying the parent so the parent's
         * completion count only increments once the graph node is durable.
         */
        prepareSyncTask: assign(({ context }) => {
            if (context.processingProgress.totalIds.length === 0) {
                logger.warn(
                    { context },
                    "No files to sync for fileId: %s",
                    context.fileId,
                );
                return {};
            }

            if (context.processingProgress.totalIds.length > 1) {
                return {
                    nextIntent: createSyncIntentOutbox("archive-uncompress", {
                        fileId: context.fileId,
                        derivedFileIds: context.processingProgress.totalIds,
                    }),
                };
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-transcode", {
                    fileId: context.fileId,
                    derivedFileId: context.processingProgress.totalIds[0],
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

        prepareNotifyParent: assign(({ context }) => {
            return {
                // nextIntent: {
                //     operation: ACTION_LIST.NOTIFY_PARENT.code,
                //     payload: {
                //         fileId: context.fileId,
                //     },
                // },
            };
        }),

        // completedNotify: assign(actions.completedNotify),

        handleFailure: assign(actions.handleFailure),

        clearNextTask: assign({ nextIntent: null }),
        notifyFrontend: ({ context }) => {
            // void actions.notifyFrontend({ context });
        },
    },
}).createMachine({
    id: "processFileItem",
    initial: "WAITING_START",
    on: {
        "*": {
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        fileId: null,
        notifyId: null,
        extensionCode: null,
        conceptId: null,
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
        WAITING_START: {
            on: {
                ARCHIVE_DISPATCH_SUCCEEDED: {
                    target: "DECIDING_PROCESS",
                    actions: "handleDispatchSuccess",
                },
            },
        },
        DECIDING_PROCESS: {
            always: [
                {
                    guard: "shouldStartUncompress",
                    target: "UNCOMPRESSING",
                    actions: "prepareUncompressTask",
                },
                {
                    guard: "shouldStartTranscode",
                    target: "TRANSCODING",
                    actions: "prepareTranscodeTask",
                },
                {
                    target: "STORAGE",
                    actions: "prepareStorageTask",
                },
            ],
        },
        UNCOMPRESSING: {
            on: {
                ARCHIVE_UNCOMPRESS_SUCCEEDED: {
                    target: "SYNCING_INTENT",
                    actions: [
                        "handleUncompressSuccess",
                        "prepareSyncIntentTask",
                    ],
                },
            },
        },
        SYNCING_INTENT: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextTask",
                },
                PYTHON_SUCCEEDED: {
                    target: "WAITING_PROCESSING",
                    actions: "prepareRecursiveUncompressTask",
                },
            },
        },
        WAITING_PROCESSING: {
            on: {
                PYTHON_SUCCEEDED: {
                    actions: "clearNextTask",
                },
                ARCHIVE_NOTIFY_SUCCESS: [
                    {
                        guard: "isAllFilesDone",
                        target: "STORAGE",
                        actions: "completedNotify",
                    },
                    {
                        actions: "completedNotify",
                    },
                ],
            },
        },
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
                    actions: "clearNextTask",
                },
                PYTHON_SUCCEEDED: {
                    target: "NOTIFY_PARENT",
                    actions: "clearNextTask",
                },
            },
        },
        NOTIFY_PARENT: {
            entry: "prepareNotifyParent",
            on: {
                PYTHON_SUCCEEDED: {
                    target: "SUCCESS",
                },
            },
        },
        SUCCESS: {
            type: "final",
            entry: ["clearNextTask", "notifyFrontend"],
        },
        FAILED: {
            type: "final",
            entry: "clearNextTask",
        },
    },
});
