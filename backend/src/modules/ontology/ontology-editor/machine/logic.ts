import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyEditorEvent } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleEditSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyEditorEvent.SUCCEEDED);

        return {
            conceptIdList: event.data.conceptIdList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
