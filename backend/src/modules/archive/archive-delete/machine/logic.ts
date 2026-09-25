/**
 * @file Encapsulated actions for concept registry machine
 *
 * Why this module exists:
 * - Keep machine.ts focused on state transitions.
 * - Isolate event parsing and payload mapping for easier unit tests.
 */

import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveDeleteEvents } from "../core/processor/delete.js";
import type { MachineEvents } from "./schema.js";

export const machineActions = {
    handleSaveSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveDeleteEvents.SUCCEEDED);
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
