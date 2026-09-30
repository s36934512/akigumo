import fs from "fs-extra";
import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveSealSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ARCHIVE_SEAL = "ARCHIVE_SEAL";

export const archiveSealProcessor = defineProcessor(
    ARCHIVE_SEAL,
    ArchiveSealSchema.single,
    async (input) => {
        const { fileId, fileName, notifyId } = input.payload;

        const sourcePath = Paths.concat("TMP_TUS", fileId);
        const sourceMetadataPath = `${sourcePath}.json`;
        const targetDir = Paths.concat("TMP_PROCESS", fileId);
        const originalFilePath = Paths.concat(targetDir, "original");

        await fs.move(sourcePath, originalFilePath, { overwrite: true });
        await fs.remove(sourceMetadataPath);

        await service.updateFileAndIntegrationRequest({
            fileId,
            fileName,
            originalFilePath,
            notifyId,
        });

        return fileId;
    },
);

export const ArchiveSealEvents = createEventCodes(ARCHIVE_SEAL, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            notifyId: z.uuid(),
            fileId: z.uuid(),
        }),
    },
]);
