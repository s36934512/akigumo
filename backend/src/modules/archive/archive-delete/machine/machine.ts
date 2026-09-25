import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#app/workflow/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_DELETE_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        shouldFailUnhandledEvent,
    },
    actions: {
        handleSaveSuccess: assign(machineActions.handleSaveSuccess),

        handleFailure: assign(machineActions.handleFailure),
        /**
         * Build pending SYNC task for asynchronous processor execution
         *
         * This decouples transition timing from worker execution timing.
         */
        prepareSyncIntent: assign(({ context }) => {
            if (context.idList.length === 0) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox(
                    "archive-delete",
                    context.idList,
                ),
            };
        }),

        clearNextIntent: assign({ nextIntent: undefined }),
    },
}).createMachine({
    id: "deleteArchive",
    initial: "SAVING_ARCHIVE",
    on: {
        "*": {
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        idList: [],
        error: null,
        nextIntent: null,
    },
    states: {
        SAVING_ARCHIVE: {
            on: {
                ARCHIVE_DELETE_SUCCEEDED: [
                    {
                        guard: ({ event }) => event.result.idList.length > 0,
                        target: "SYNCING_CONCEPT",
                        actions: ["handleSaveSuccess", "prepareSyncIntent"],
                    },
                    {
                        target: "SUCCESS",
                        actions: "clearNextIntent",
                    },
                ],
            },
        },

        SYNCING_CONCEPT: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },
                PYTHON_SUCCEEDED: {
                    target: "SUCCESS",
                    actions: "clearNextIntent",
                },
            },
        },

        SUCCESS: {
            entry: "clearNextIntent",
            type: "final",
        },

        FAILED: {
            entry: "clearNextIntent",
            type: "final",
        },
    },
});
