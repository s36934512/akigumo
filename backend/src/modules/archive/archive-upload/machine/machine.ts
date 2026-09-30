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

            return successIdList.length === totalIdList.length;
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

        clearNextTask: assign({ nextIntent: null }),

        markFileUploaded: assign(actions.markFileUploaded),

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
        notifyId: null,
        batchId: null,
        processingProgress: {
            totalIdList: [],
            successIdList: [],
        },
    },
    states: {
        VALIDATING_INTENT: {
            on: {
                ARCHIVE_INTENT_SUCCEEDED: [
                    {
                        guard: ({ event }) => event.data.fileList.length > 0,
                        target: "SYNCING_INTENT",
                        actions: ["handleIntentSuccess", "prepareSyncTask"],
                    },
                    {
                        target: "SUCCESS",
                    },
                ],
            },
        },

        SYNCING_INTENT: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextTask",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    target: "WAITING",
                    actions: "clearNextTask",
                },
            },
        },

        WAITING: {
            on: {
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
