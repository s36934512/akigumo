import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";

import * as Paths from "#app/infrastructure/storage/paths.js";

import type { UploadFinishedQueue } from "../queue/port/upload-finished-queue.js";

export function createTusServer(uploadFinishedQueue: UploadFinishedQueue) {
    return new Server({
        path: "/api/v1/tus/files",
        datastore: new FileStore({
            directory: Paths.TMP_TUS,
        }),
        relativeLocation: true,

        async onUploadFinish(_req, upload) {
            const fileId = upload.metadata?.fileId;

            if (!fileId) {
                throw new Error("TUS upload is missing fileId metadata");
            }

            await uploadFinishedQueue.add({
                fileId,
                uploadId: upload.id,
            });

            return {};
        },
    });
}
