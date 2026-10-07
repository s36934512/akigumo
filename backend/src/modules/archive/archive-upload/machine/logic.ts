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
        const { uploadedIdList, pendingDispatchIdList } =
            context.processingProgress;

        if (uploadedIdList.includes(fileId)) return context;

        return {
            processingProgress: {
                uploadedIdList: [...uploadedIdList, fileId],
                pendingDispatchIdList: [...pendingDispatchIdList, fileId],
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
