import fs from "fs-extra";
import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveUploadFinishedSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ARCHIVE_UPLOAD_FINISHED = "ARCHIVE_UPLOAD_FINISHED";

export const archiveUploadFinishedProcessor = defineProcessor(
    ARCHIVE_UPLOAD_FINISHED,
    ArchiveUploadFinishedSchema.single,
    async (input) => {
        const { fileId, uploadId } = input.payload;

        const sourcePath = Paths.concat("TMP_TUS", uploadId);
        const sourceMetadataPath = `${sourcePath}.json`;
        const targetDir = Paths.concat("TMP_PROCESS", fileId);
        const originalFilePath = Paths.concat(targetDir, "original");

        await fs.move(sourcePath, originalFilePath, { overwrite: true });
        await fs.remove(sourceMetadataPath);

        await service.updateFileAndIntegrationRequest({
            fileId,
            originalFilePath,
        });

        return fileId;
    },
);

export const ArchiveUploadFinishedEvents = createEventCodes(
    ARCHIVE_UPLOAD_FINISHED,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                fileId: z.uuid(),
            }),
        },
    ],
);
