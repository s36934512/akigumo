import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildArchiveTranscodeTask } from "../factory/archive-transcode.js";

const InputSchema = z.object({
    fileId: z.uuid(),
    derivedFileId: z.uuid(),
});

export const archiveTranscodeTask = defineGraphSyncTask({
    name: "archive-transcode",
    schema: InputSchema,
    execute: async (input) => {
        const { fileId, derivedFileId } = input;

        const files = await prisma.file.findMany({
            where: {
                id: {
                    in: [fileId, derivedFileId],
                },
            },
        });

        // 分離結果
        const file = files.find((f) => f.id === fileId) || null;
        const derivedFile = files.find((f) => f.id === derivedFileId) || null;

        if (!file || !derivedFile) {
            throw new Error("file not found");
        }

        const getDimensions = (metadata: unknown) => {
            if (
                metadata &&
                typeof metadata === "object" &&
                "width" in metadata &&
                "height" in metadata
            ) {
                return metadata as { width?: number; height?: number };
            }
            return undefined;
        };
        const fileMeta = getDimensions(file.metadata);
        const derivedMeta = getDimensions(derivedFile.metadata);

        return {
            taskType: "CreateDerivedFileExecutor",
            payload: [
                buildArchiveTranscodeTask({
                    fileId: derivedFile.id,
                    fileExtensionCode: derivedFile.extensionCode,
                    width: derivedMeta?.width,
                    height: derivedMeta?.height,

                    originalFileId: file.id,
                    originalFileExtensionCode: file.extensionCode,
                    originalFileWidth: fileMeta?.width,
                    originalFileHeight: fileMeta?.height,
                }),
            ],
        };
    },
});
