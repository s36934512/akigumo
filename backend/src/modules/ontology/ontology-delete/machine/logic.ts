import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyDeleteEvents } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleDeleteSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyDeleteEvents.SUCCEEDED);
        return {
            notifyId: event.data.notifyId,
            idList: event.data.idList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
