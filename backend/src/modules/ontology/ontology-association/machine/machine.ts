import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ONTOLOGY_ASSOCIATION_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },
    guards: {
        hasGraphSyncData: ({ context }) => {
            if (
                context.conceptPool === null ||
                context.associationList === null
            ) {
                return false;
            }

            return true;
        },
    },
    actions: {
        handleAssociationSuccess: assign(
            machineActions.handleAssociationSuccess,
        ),

        prepareGraphSyncIntent: assign(({ context }) => {
            if (
                context.conceptPool === null ||
                context.associationList === null
            ) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox("concept-association", {
                    conceptPool: context.conceptPool,
                    associationList: context.associationList,
                }),
            };
        }),

        handleFailure: assign(machineActions.handleFailure),

        clearNextIntent: assign({ nextIntent: undefined }),
    },
}).createMachine({
    id: "ontologyAssociation",
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
        associationList: null,
    },
    states: {
        INDEXING: {
            on: {
                ONTOLOGY_ASSOCIATION_SUCCEEDED: [
                    {
                        actions: ["handleAssociationSuccess"],
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
