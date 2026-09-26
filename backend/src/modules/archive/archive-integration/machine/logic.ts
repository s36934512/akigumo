import { assertEvent } from "xstate";
import { isWorkflowFailureEvent } from "#app/workflow/index.js";
import {
    ArchiveDispatchEvents,
    ArchiveTranscodeEvents,
    ArchiveUncompressEvents,
} from "../core/processor/index.js";
import type { MachineContext, MachineEvents } from "./schema.js";

export const actions = {
    handleDispatchSuccess({ event }: { event: MachineEvents }) {
        assertEvent(event, ArchiveDispatchEvents.SUCCEEDED);

        return {
            // fileId: event.payload.fileId,
            // notifyId: event.payload.notifyId ?? null,
            // extensionCode: event.payload.extensionCode,
            // strategy: event.payload.strategy,
            // uncompressMaxDepth: event.payload.uncompressMaxDepth,
        };
    },

    handleTranscodeSuccess({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveTranscodeEvents.SUCCEEDED);

        return {
            // processingProgress: {
            //     ...context.processingProgress,
            //     totalIds: [
            //         ...context.processingProgress.totalIds,
            //         event.payload.fileId,
            //     ],
            // },
        };
    },

    handleUncompressSuccess({
        context,
        event,
    }: {
        context: MachineContext;
        event: MachineEvents;
    }) {
        assertEvent(event, ArchiveUncompressEvents.SUCCEEDED);

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

    // completedNotify({
    //     context,
    //     event,
    // }: {
    //     context: MachineContext;
    //     event: MachineEvents;
    // }) {
    //     assertEvent(event, EventCode.ARCHIVE_NOTIFY_SUCCESS);
    //     const fileId = event.payload.fileId;
    //     const { successIds, failedIds } = context.processingProgress;

    //     if (!context.processingProgress.totalIds.includes(fileId)) {
    //         logger.warn(
    //             { fileId },
    //             "Received notify success for fileId not in totalIds, skipping notification",
    //         );
    //         return context;
    //     }
    //     if (successIds.includes(fileId) || failedIds.includes(fileId)) {
    //         logger.warn(
    //             { fileId },
    //             "Received notify success for fileId already in successIds or failedIds, skipping notification",
    //         );
    //         return context;
    //     }

    //     // 修正：不再手動組裝 PATCH，直接呼叫統一的補全通知器
    //     // 這樣當檔案狀態變更為 COMPLETED 時，前端能收到包含新 Metadata 的完整實體
    //     // notifyIndexPatchesForFileIds(
    //     //     context.notifyUploadId || 'unknown',
    //     //     [fileId]
    //     // ).catch((err) => {
    //     //     logger.error({ err, fileId }, 'Failed to publish refreshed file INDEX_PATCH');
    //     // });

    //     // PROGRESS 事件保持，用於進度條
    //     // notifyClient({
    //     //     notifyUploadId: context.notifyUploadId || 'unknown',
    //     //     type: 'PROGRESS',
    //     //     payload: { processedDelta: 1, fileId },
    //     // }).catch((err) => {
    //     //     logger.error({ err, fileId }, 'Failed to publish PROGRESS SSE event');
    //     // });

    //     return {
    //         processingProgress: {
    //             ...context.processingProgress,
    //             successIds: [...successIds, fileId],
    //         },
    //     };
    // },

    // async notifyFrontend({ context }: { context: MachineContext }) {
    //     if (!context.notifyId || !context.fileId) return;

    //     try {
    //         await notifyIndexPatches(context.notifyId, [context.fileId]);
    //         await notifyClient({
    //             notifyId: context.notifyId,
    //             type: "COMPLETED",
    //             payload: { fileId: context.fileId },
    //         });
    //     } catch (error) {
    //         logger.error(
    //             { error, fileId: context.fileId },
    //             "Failed to publish archive integration completion SSE event",
    //         );
    //     }
    // },

    handleFailure({ event }: { event: MachineEvents }) {
        if (!isWorkflowFailureEvent(event)) {
            return {};
        }

        return { error: event.result.reason };
    },
};
