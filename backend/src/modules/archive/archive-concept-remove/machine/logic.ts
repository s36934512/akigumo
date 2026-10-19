import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveConceptRemoveEvent } from "../core/processor/archive-concept-remove.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveConceptRemoveEvent.SUCCEEDED);

        return {
            request: event.data,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
