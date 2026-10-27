import { assertEvent } from "xstate";

import { uniqueArray } from "#app/utils/array.js";
import { isWorkflowFailureEvent } from "#app/workflow/index.js";

import {
    ArchiveNotifyBootstrapEvent,
    ArchiveTranscodeEvent,
    ArchiveUncompressEvent,
} from "../core/processor/index.js";
import { ArchiveIntegrationBootstrapEvent } from "./events.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const actions = {
    handleBootstrapSucceeded({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveIntegrationBootstrapEvent.SUCCEEDED);

        return {
            currentFileId: event.data.fileId,
            parentWorkflowId: event.data.parentWorkflowId,
            strategy: event.data.strategy,
            remainingUncompressDepth: event.data.remainingUncompressDepth,
        };
    },

    handleTranscodeSucceeded({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveTranscodeEvent.SUCCEEDED);

        return {
            transcodedFileId: event.data.fileId,
        };
    },

    handleUncompressSucceeded({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveUncompressEvent.SUCCEEDED);

        const extractedFileIdList = uniqueArray([
            ...context.processingProgress.extractedFileIdList,
            ...event.data.extractedFileIdList,
        ]);

        return {
            processingProgress: {
                ...context.processingProgress,
                extractedFileIdList,
            },
        };
    },

    handleChildCompletionReported({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveNotifyBootstrapEvent.SUCCEEDED);

        const { fileId, succeeded } = event.data;
        const { succeededFileIdList, failedFileIdList } =
            context.processingProgress;

        if (succeeded) {
            return {
                processingProgress: {
                    ...context.processingProgress,
                    succeededFileIdList: uniqueArray([
                        ...succeededFileIdList,
                        fileId,
                    ]),
                    failedFileIdList: failedFileIdList.filter(
                        (id) => id !== fileId,
                    ),
                },
            };
        }

        return {
            processingProgress: {
                ...context.processingProgress,
                succeededFileIdList: succeededFileIdList.filter(
                    (id) => id !== fileId,
                ),
                failedFileIdList: uniqueArray([...failedFileIdList, fileId]),
            },
        };
    },

    handleFailure({ event }: { event: MachineEvents }) {
        if (isWorkflowFailureEvent(event)) {
            return {
                error: event.error,
            };
        }

        return {};
    },
};
