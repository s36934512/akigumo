import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ONTOLOGY_REGISTRY_FLOW_V1";

export const machine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvents,
    },

    actions: {
        handleRegistrySuccess: assign(machineActions.handleRegistrySuccess),

        handleFailure: assign(machineActions.handleFailure),

        prepareGraphSyncIntent: assign(({ context }) => {
            if (context.conceptIdList === null) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox(
                    "concept-registry",
                    context.conceptIdList,
                ),
            };
        }),

        clearNextIntent: assign({ nextIntent: undefined }),
    },
}).createMachine({
    id: "ontologyRegistry",
    initial: "CREATING_CONCEPT",
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
        CREATING_CONCEPT: {
            on: {
                ONTOLOGY_REGISTRY_SUCCEEDED: [
                    {
                        guard: ({ event }) =>
                            event.data.conceptIdList.length > 0,
                        target: "SYNCING_GRAPH",
                        actions: [
                            "handleRegistrySuccess",
                            "prepareGraphSyncIntent",
                        ],
                    },
                    {
                        target: "SUCCESS",
                    },
                ],
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
