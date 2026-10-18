import { assertEvent } from "xstate";
import { isWorkflowFailureEvent } from "#app/workflow/index.js";
import { ArchiveIntegrationBootstrapEvent } from "../core/processor/dispatch.js";
import {
    ArchiveTranscodeEvent,
    ArchiveUncompressEvent,
} from "../core/processor/index.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const actions = {
    handleIntegrationBootstrapSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveIntegrationBootstrapEvent.SUCCEEDED);

        return {
            fileId: event.data.fileId,
            strategy: event.data.strategy,
            uncompressMaxDepth: event.data.uncompressMaxDepth,
        };
    },

    handleTranscodeSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveTranscodeEvent.SUCCEEDED);

        return {
            derivedFileId: event.data.fileId,
        };
    },

    handleUncompressSuccess({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveUncompressEvent.SUCCEEDED);

        return {
            // processingProgress: {
            //     ...context.processingProgress,
            //     totalIds: [
            //         ...context.processingProgress.totalIds,
            //         ...event.payload.fileIds,
            //     ],
            // },
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
