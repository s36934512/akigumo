import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveUploadFinishedEvents } from "../core/processor/upload-finished.js";
import {
    ArchiveIntentEvents,
    type MachineContext,
    type MachineEvents,
} from "./schema.js";

export const actions = {
    handleIntentSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveIntentEvents.SUCCEEDED);

        return {
            fileList: event.data.fileIdList,
            processingProgress: {
                totalIdList: [...event.data.fileIdList],
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
        assertEvent(event, ArchiveUploadFinishedEvents.SUCCEEDED);

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
