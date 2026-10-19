import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_CONCEPT_REMOVE_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        hasGraphSyncData: ({ context }) => {
            if (context.request === null) {
                return false;
            }

            return true;
        },
    },
    actions: {
        handleSaveSuccess: assign(machineActions.handleSaveSuccess),

        handleFailure: assign(machineActions.handleFailure),

        clearNextIntent: assign({ nextIntent: undefined }),

        prepareGraphSyncIntent: assign(({ context }) => {
            if (context.request === null) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox(
                    "concept-association-remove",
                    {
                        request: context.request,
                    },
                ),
            };
        }),
    },
}).createMachine({
    id: "archive-concept-remove",
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
        request: null,
    },
    states: {
        INDEXING: {
            on: {
                WORKFLOW_BOOTSTRAP_SUCCEEDED: {
                    actions: ["handleSaveSuccess"],
                },
            },

            always: {
                guard: "hasGraphSyncData",
                target: "SYNCING_GRAPH",
                actions: "prepareGraphSyncIntent",
            },
        },

        SYNCING_GRAPH: {
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
