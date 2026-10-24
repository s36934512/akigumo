/**
 * @file Encapsulated actions for concept registry machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing and payload mapping for easier unit tests.
 */

import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveDeleteEvent } from "../core/processor/delete.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveDeleteEvent.SUCCEEDED);

        return {
            archiveIdList: event.data.archiveIdList,
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
