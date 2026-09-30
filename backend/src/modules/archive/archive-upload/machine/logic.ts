import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveIntentEvents } from "../core/processor/intent.js";
import { ArchiveSealEvents } from "../core/processor/seal.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const actions = {
    handleIntentSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveIntentEvents.SUCCEEDED);

        return {
            notifyId: event.data.notifyId,
            batchId: event.data.batchId,
            fileList: event.data.fileList,
            processingProgress: {
                totalIdList: [...event.data.fileList],
                successIdList: [],
            },
        };
    },

    markFileUploaded({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveSealEvents.SUCCEEDED);

        const fileId = event.data.fileId;
        const { successIdList } = context.processingProgress;

        if (successIdList.includes(fileId)) return context;

        return {
            processingProgress: {
                ...context.processingProgress,
                successIdList: [...successIdList, fileId],
            },
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.error };
    },
};
