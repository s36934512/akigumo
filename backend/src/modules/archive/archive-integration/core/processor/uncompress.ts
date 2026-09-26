import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import type { Prisma } from "#app/generated/prisma/client.js";
import {
    ArchiveStatus,
    ArchiveType,
    FileStatus,
} from "#app/generated/prisma/enums.js";
import {
    ArchiveCreateManyInputObjectZodSchema,
    FileCreateManyInputObjectZodSchema,
} from "#app/generated/zod/schemas/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor, NonRetryableError } from "#app/kernel/index.js";

import { getOrCreateDefaultExt } from "../../extension/default.js";

import {
    createExtractedFiles,
    extractArchive,
    moveMassiveFiles,
} from "../uncompress.js";

export const ARCHIVE_UNCOMPRESS = "ARCHIVE_UNCOMPRESS";

export const UncompressInputSchema = z.object({
    fileId: z.uuid(),
    extensionCode: z.string(),
});

export const archiveUncompressProcessor = defineProcessor(
    ARCHIVE_UNCOMPRESS,
    UncompressInputSchema,
    async (input) => {
        const extractedFiles = await extractArchive(
            input.payload.fileId,
            input.payload.extensionCode,
        );
        const defaultExt = await getOrCreateDefaultExt();

        const fileListWithPaths = extractedFiles.map((absolutePath) => {
            const id = uuidv7();
            const physicalPath = Paths.concat("TMP_PROCESS", id, "original");

            const result = FileCreateManyInputObjectZodSchema.safeParse({
                id,
                originalName: Paths.basename(absolutePath),
                physicalPath: physicalPath,
                isOriginal: true,
                status: FileStatus.PROCESSING,
                fileExtensionId: defaultExt.id,
            });

            if (!result.success) {
                throw new NonRetryableError(result.error.message);
            }
            return {
                result: result.data as Prisma.FileCreateManyInput,
                absolutePath,
                physicalPath,
            };
        });
        const fileList = fileListWithPaths.map((f) => f.result);
        const itemList = fileList.map((f) => {
            const result = ArchiveCreateManyInputObjectZodSchema.safeParse({
                id: f.id,
                name: f.originalName,
                type: ArchiveType.FILE_CONTAINER,
                status: ArchiveStatus.PROCESSING,
            });
            if (!result.success) {
                throw new NonRetryableError(result.error.message);
            }
            return result.data as Prisma.ArchiveCreateManyInput;
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
        resultSchema: z.object({
            notifyId: z.uuid(),
            idList: z.uuid().array(),
        }),
    },
    {
        code: "FAILED",
        resultSchema: z.object({
            reason: z.string(),
        }),
    },
]);
