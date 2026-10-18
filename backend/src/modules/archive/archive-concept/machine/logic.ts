import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveConceptEvent } from "../core/processor/archive-concept.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveConceptEvent.SUCCEEDED);

        return {
            conceptPool: event.data.conceptPool,
            associationList: event.data.associationList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
