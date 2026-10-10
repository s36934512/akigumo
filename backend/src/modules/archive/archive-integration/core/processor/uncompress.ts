import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import type { Prisma } from "#app/generated/prisma/client.js";
import { ArchiveStatus, ArchiveType } from "#app/generated/prisma/enums.js";
import {
    ArchiveCreateInputObjectZodSchema,
    FileCreateInputObjectZodSchema,
} from "#app/generated/zod/schemas/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor, NonRetryableError } from "#app/kernel/index.js";

import {
    createExtractedFiles,
    extractArchive,
    moveMassiveFiles,
} from "../uncompress.js";

export const ARCHIVE_UNCOMPRESS = "ARCHIVE_UNCOMPRESS";

export const UncompressInputSchema = z.object({
    fileId: z.uuid(),
});

export const archiveUncompressProcessor = defineProcessor(
    ARCHIVE_UNCOMPRESS,
    UncompressInputSchema,
    async (input) => {
        const extractedFiles = await extractArchive(input.payload.fileId);

        const fileListWithPaths = extractedFiles.map((absolutePath) => {
            const id = uuidv7();
            const physicalPath = Paths.concat("TMP_PROCESS", id, "original");

            const result = FileCreateInputObjectZodSchema.safeParse({
                id,
                originalName: Paths.basename(absolutePath),
                physicalPath: physicalPath,
                isOriginal: false,
                metadata: {
                    path: absolutePath,
                },
            });

            if (!result.success) {
                throw new NonRetryableError(result.error.message);
            }

            return {
                result: result.data as Prisma.FileCreateInput,
                absolutePath,
                physicalPath,
            };
        });

        const fileList = fileListWithPaths.map((f) => f.result);
        const itemList = fileList.map((f) => {
            const result = ArchiveCreateInputObjectZodSchema.safeParse({
                id: f.id,
                name: f.originalName,
                type: ArchiveType.FILE_CONTAINER,
                status: ArchiveStatus.PROCESSING,
            });

            if (!result.success) {
                throw new NonRetryableError(result.error.message);
            }

            return result.data as Prisma.ArchiveCreateInput;
        });

        await moveMassiveFiles(
            fileListWithPaths.map((f) => ({
                sourcePath: f.absolutePath,
                targetPath: f.physicalPath,
            })),
        );
        await createExtractedFiles({ fileList, itemList });

        return {
            fileIds: fileList.map((f) => f.id),
        };
    },
);

export const ArchiveUncompressEvents = createEventCodes(ARCHIVE_UNCOMPRESS, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            notifyId: z.uuid(),
            idList: z.uuid().array(),
        }),
    },
]);
