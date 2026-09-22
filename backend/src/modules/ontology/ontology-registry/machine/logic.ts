import { assertEvent } from "xstate";

import { OntologyRegistryEvents } from "../core/index.js";
import type { MachineEvents } from "./schema.js";

type WorkflowFailureEvent = Extract<
    MachineEvents,
    { type: `${string}_FAILED` }
>;

function isWorkflowFailureEvent(
    event: MachineEvents,
): event is WorkflowFailureEvent {
    return event.type.endsWith("_FAILED");
}

export const machineActions = {
    handleRegistrySuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, OntologyRegistryEvents.SUCCEEDED);
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
