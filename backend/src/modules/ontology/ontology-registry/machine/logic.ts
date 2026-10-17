import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyRegistryEvent } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleRegistrySuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyRegistryEvent.SUCCEEDED);
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
