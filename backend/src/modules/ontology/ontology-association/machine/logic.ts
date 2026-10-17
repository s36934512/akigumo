import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyAssociationEvent } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleAssociationSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyAssociationEvent.SUCCEEDED);

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
