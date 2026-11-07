import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ONTOLOGY_DELETE_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        hasGraphSyncData: ({ context }) => {
            if (context.conceptIdList === null) {
                return false;
            }

            return true;
        },
    },
    actions: {
        handleDeleteSuccess: assign(machineActions.handleDeleteSuccess),

        handleFailure: assign(machineActions.handleFailure),

        prepareGraphSyncIntent: assign(({ context }) => {
            if (
                context.conceptIdList === null ||
                context.conceptIdList.length === 0
            ) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox(
                    "concept-delete",
                    context.conceptIdList,
                ),
            };
        }),

        clearNextIntent: assign({ nextIntent: undefined }),
    },
}).createMachine({
    id: "ontologyDelete",
    initial: "SAVING_CONCEPT",
    on: {
        "*": {
            target: ".FAILED",
            actions: "handleFailure",
        },
    },
    context: {
        error: null,
        nextIntent: null,
        conceptIdList: null,
    },
    states: {
        SAVING_CONCEPT: {
            on: {
                ONTOLOGY_DELETE_SUCCEEDED: {
                    target: "CHECK_GRAPH_SYNC",
                    actions: "handleDeleteSuccess",
                },
            },
        },

        CHECK_GRAPH_SYNC: {
            always: [
                {
                    guard: "hasGraphSyncData",
                    target: "SYNCING_GRAPH",
                    actions: "prepareGraphSyncIntent",
                },
                {
                    target: "SUCCESS",
                },
            ],
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
            entry: "clearNextIntent",
            type: "final",
        },

        FAILED: {
            entry: "clearNextIntent",
            type: "final",
        },
    },
});
