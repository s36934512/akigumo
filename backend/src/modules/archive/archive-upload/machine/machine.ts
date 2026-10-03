import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#app/workflow/index.js";

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
            const { totalIdList, successIdList } = context.processingProgress;

            return (
                context.graphSyncCompleted &&
                successIdList.length === totalIdList.length
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

        clearNextTask: assign({ nextIntent: null }),

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
            totalIdList: [],
            successIdList: [],
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
                    actions: "clearNextTask",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    actions: ["handleSyncTaskSuccess", "clearNextTask"],
                },

                ARCHIVE_SEAL_SUCCEEDED: {
                    actions: "markFileUploaded",
                },
            },

            always: {
                guard: "isAllFilesDone",
                target: "SUCCESS",
            },
        },

        SUCCESS: {
            type: "final",
            entry: "clearNextTask",
        },

        FAILED: {
            type: "final",
            entry: "clearNextTask",
        },
    },
});
