import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyPairEvent } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handlePairSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyPairEvent.SUCCEEDED);

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
