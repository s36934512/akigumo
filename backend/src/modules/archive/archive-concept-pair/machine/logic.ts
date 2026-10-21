import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveConceptPairEvent } from "../core/processor/archive-concept-pair.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handlePairSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveConceptPairEvent.SUCCEEDED);

        return {
            conceptPool: event.data.conceptPool,
            pairAssociationList: event.data.pairAssociationList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
