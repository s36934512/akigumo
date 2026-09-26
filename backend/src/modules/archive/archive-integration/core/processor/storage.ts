import fs from "fs-extra";
import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor } from "#app/kernel/index.js";

import * as service from "../storage.js";

export const ARCHIVE_STORAGE = "ARCHIVE_STORAGE";

const StorageInputSchema = z.object({
    fileId: z.uuid(),
    fileList: z.uuid().array(),
});

export const archiveStorageProcessor = defineProcessor(
    ARCHIVE_STORAGE,
    StorageInputSchema,
    async (input) => {
        const { fileId, fileList } = input.payload;

        const processDir = Paths.concat("TMP_PROCESS", fileId);
        const finalDir = Paths.concat("STORAGE_ORIGINALS", fileId);

        await fs.copy(processDir, finalDir, { overwrite: true });
        await fs.remove(processDir);

        await service.updateFilePath(
            fileList.concat(fileId),
            Paths.TMP_PROCESS,
            Paths.STORAGE_ORIGINALS,
        );

        return input.payload;
    },
);

export const ArchiveStorageEvents = createEventCodes(ARCHIVE_STORAGE, [
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
