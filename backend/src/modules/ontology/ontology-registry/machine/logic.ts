import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { OntologyRegistryEvents } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleRegistrySuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyRegistryEvents.SUCCEEDED);
        return {
            notifyId: event.data.notifyId,
            idList: event.data.idList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.data.reason };
    },
};
