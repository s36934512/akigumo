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
    guards: {
        hasGraphSyncData: ({ context }) => {
            if (
                context.conceptPool === null ||
                context.pairAssociationList === null
            ) {
                return false;
            }

            return true;
        },
    },
    actions: {
        handlePairSuccess: assign(machineActions.handlePairSuccess),

        prepareGraphSyncIntent: assign(({ context }) => {
            if (
                context.conceptPool === null ||
                context.pairAssociationList === null
            ) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox("concept-pair", {
                    conceptPool: context.conceptPool,
                    pairAssociationList: context.pairAssociationList,
                }),
            };
        }),

        handleFailure: assign(machineActions.handleFailure),

        clearNextIntent: assign({ nextIntent: undefined }),
    },
}).createMachine({
    id: "ontologyPair",
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
        conceptPool: null,
        pairAssociationList: null,
    },
    states: {
        INDEXING: {
            on: {
                ARCHIVE_CONCEPT_PAIR_SUCCEEDED: [
                    {
                        actions: ["handlePairSuccess"],
                    },
                ],
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
            entry: "clearNextIntent",
            type: "final",
        },

        FAILED: {
            entry: "clearNextIntent",
            type: "final",
        },
    },
});
