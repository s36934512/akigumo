import { assertEvent } from "xstate";

import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import { ArchiveDispatchEvents } from "../../archive-integration/index.js";
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
            fileList: Array.from(new Set(event.data.fileIdList)),
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

        if (!context.fileList.includes(fileId)) {
            return context;
        }

        const { uploadedIdList, pendingDispatchIdList } =
            context.processingProgress;

        if (uploadedIdList.includes(fileId)) return context;

        return {
            processingProgress: {
                ...context.processingProgress,
                uploadedIdList: [...uploadedIdList, fileId],
                pendingDispatchIdList: [...pendingDispatchIdList, fileId],
            },
        };
    },

    handleDispatchSuccess({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveDispatchEvents.SUCCEEDED);

        const dispatchedIdSet = new Set(
            context.processingProgress.dispatchedIdList,
        );

        for (const fileId of event.data.fileIdList) {
            dispatchedIdSet.add(fileId);
        }

        return {
            processingProgress: {
                ...context.processingProgress,
                dispatchedIdList: Array.from(dispatchedIdSet),
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
