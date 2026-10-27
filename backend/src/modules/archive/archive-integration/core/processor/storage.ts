import fs from "fs-extra";
import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor } from "#app/kernel/index.js";

import * as service from "../storage.js";

export const ARCHIVE_FINALIZE_STORAGE = "ARCHIVE_FINALIZE_STORAGE";

const StorageInputSchema = z.object({
    fileId: z.uuid(),
    fileList: z.uuid().array(),
});

export const archiveStorageProcessor = defineProcessor(
    ARCHIVE_FINALIZE_STORAGE,
    StorageInputSchema,
    async (input) => {
        const { fileId, fileList } = input.payload;

        const { processDir, finalDir } = await service.getFilePath(fileId);

        if (!finalDir) return {};

        await fs.copy(processDir, finalDir, { overwrite: true });
        await fs.remove(processDir);

        await service.updateFilePath(
            fileList.concat(fileId),
            Paths.TMP_PROCESS,
            Paths.STORAGE_ORIGINALS,
        );

        return {};
    },
);

export const ArchiveStorageEvent = defineEventContract(
    ARCHIVE_FINALIZE_STORAGE,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({}),
        },
    ],
);
