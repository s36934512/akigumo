import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveConceptEvents } from "../core/processor/archive-concept.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveConceptEvents.SUCCEEDED);
        return { pool: event.result.pool, entryList: event.result.entryList };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.result.reason };
    },
};
