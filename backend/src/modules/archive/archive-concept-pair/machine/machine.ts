import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_CONCEPT_PAIR_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    actions: {
        handleSaveSuccess: assign(machineActions.handleSaveSuccess),

        handleFailure: assign(machineActions.handleFailure),

        clearNextIntent: assign({ nextIntent: undefined }),

        prepareSyncIntent: assign(({ context }) => {
            if (!context.pool && !context.entryList) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-concept-pair", {
                    pool: context.pool,
                    entryList: context.entryList,
                }),
            };
        }),
    },
}).createMachine({
    id: "archive-concept-pair",
    initial: "INDEXING",
    on: {
        "*": {
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        error: null,
        nextIntent: null,
    },
    states: {
        INDEXING: {
            on: {
                ARCHIVE_CONCEPT_PAIR_SUCCEEDED: {
                    target: "SYNCING_CONCEPT",
                    actions: ["handleSaveSuccess", "prepareSyncIntent"],
                },
            },
        },

        SYNCING_CONCEPT: {
            on: {
                GRAPH_INTENT_CREATED_SUCCEEDED: {
                    actions: "clearNextIntent",
                },

                GRAPH_OPERATION_RESULT_SUCCEEDED: {
                    target: "SUCCESS",
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
