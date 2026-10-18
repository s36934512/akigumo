import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveConceptPairEvent } from "../core/processor/archive-concept-pair.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveConceptPairEvent.SUCCEEDED);

        return {
            pool: event.data.pool,
            entryList: event.data.entryList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
