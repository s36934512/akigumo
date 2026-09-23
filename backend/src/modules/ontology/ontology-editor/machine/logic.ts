import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyEditorEvents } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleEditSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyEditorEvents.SUCCEEDED);
        return {
            notifyId: event.result.notifyId,
            idList: event.result.idList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.result.reason };
    },
};
