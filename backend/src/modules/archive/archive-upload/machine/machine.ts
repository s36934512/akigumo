import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#app/workflow/index.js";

import { ARCHIVE_DISPATCH } from "../../archive-integration/core/processor/dispatch.js";
import { actions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_UPLOAD_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        isAllFilesDone: ({ context }) => {
            const { uploadedIdList } = context.processingProgress;

            return (
                context.graphSyncCompleted &&
                uploadedIdList.length === context.fileList.length
            );
        },

        shouldFailUnhandledEvent,
    },
    actions: {
        handleIntentSuccess: assign(actions.handleIntentSuccess),

        prepareSyncTask: assign(({ context }) => {
            return {
                nextIntent: createSyncIntentOutbox(
                    "file-registry",
                    context.fileList.map((id) => ({
                        fileId: id,
                        archiveId: id,
                    })),
                ),
            };
        }),

        handleSyncTaskSuccess: assign({
            graphSyncCompleted: true,
        }),

        markFileUploaded: assign(actions.markFileUploaded),

        prepareDispatchIntent: assign(({ context }) => {
            const { pendingDispatchIdList } = context.processingProgress;

            if (
                pendingDispatchIdList.length === 0 ||
                context.graphSyncCompleted === false
            ) {
                return {};
            }

            return {
                nextIntent: {
                    operation: ARCHIVE_DISPATCH,
                    payload: {
                        fileIdList: pendingDispatchIdList,
                        uncompressMaxDepth: 3,
                    },
                },

                processingProgress: {
                    ...context.processingProgress,
                    pendingDispatchIdList: [],
                },
            };
        }),

        clearNextIntent: assign({ nextIntent: null }),

        handleFailure: assign(actions.handleFailure),
    },
}).createMachine({
    id: "createFile",
    initial: "VALIDATING_INTENT",
    on: {
        "*": {
            guard: "shouldFailUnhandledEvent",
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        fileList: [],
        error: null,
        nextIntent: null,
        processingProgress: {
            uploadedIdList: [],
            pendingDispatchIdList: [],
        },
        graphSyncCompleted: false,
    },
    states: {
        VALIDATING_INTENT: {
            on: {
                WORKFLOW_BOOTSTRAP_SUCCEEDED: [
                    {
                        guard: ({ event }) => event.data.fileIdList.length > 0,
                        target: "WAITING",
                        actions: ["handleIntentSuccess", "prepareSyncTask"],
                    },
                    {
                        target: "SUCCESS",
                    },
                ],
            },
        },

        WAITING: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    actions: ["handleSyncTaskSuccess", "prepareDispatchIntent"],
                },

                ARCHIVE_UPLOAD_FINISHED_SUCCEEDED: {
                    actions: ["markFileUploaded", "prepareDispatchIntent"],
                },
            },

            always: {
                guard: "isAllFilesDone",
                target: "SUCCESS",
            },
        },

        SUCCESS: {
            type: "final",
        },

        FAILED: {
            type: "final",
            entry: "clearNextIntent",
        },
    },
});
