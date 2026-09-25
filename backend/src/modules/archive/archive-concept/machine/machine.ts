import { assign, setup } from "xstate";

import { createSyncIntentOutbox } from "#app/modules/graph/graph-sync/index.js";
import { shouldFailUnhandledEvent } from "#app/workflow/index.js";

import { machineActions } from "./logic.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const WORKFLOW_TYPE = "ARCHIVE_CONCEPT_FLOW_V1";

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
        clearNextIntent: assign({ nextIntent: undefined }),
        prepareSyncIntent: assign(({ context }) => {
            if (!context.pool && !context.entryList) {
                return { nextIntent: undefined };
            }

            return {
                nextIntent: createSyncIntentOutbox("archive-concept", {
                    pool: context.pool,
                    entryList: context.entryList,
                }),
            };
        }),
    },
}).createMachine({
    id: "archive-concept-index",
    initial: "INDEXING",
    on: {
        "*": {
            guard: "shouldFailUnhandledEvent",
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
                ARCHIVE_CONCEPT_SUCCEEDED: {
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
                PYTHON_SUCCESS: {
                    target: "SUCCESS",
                    actions: "clearNextIntent",
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
