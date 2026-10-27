import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { transcodeImageToWebp } from "../transcode.js";

export const ARCHIVE_TRANSCODE = "ARCHIVE_TRANSCODE";

export const InputSchema = z.object({
    fileId: z.uuid(),
});

export const archiveTranscodeProcessor = defineProcessor(
    ARCHIVE_TRANSCODE,
    InputSchema,
    async (input) => {
        return transcodeImageToWebp(input.payload.fileId);
    },
);

export const ArchiveTranscodeEvent = defineEventContract(ARCHIVE_TRANSCODE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            fileId: z.uuid(),
        }),
    },
]);
