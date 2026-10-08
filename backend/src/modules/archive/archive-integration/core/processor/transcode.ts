import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { transcode } from "../transcode.js";

export const ARCHIVE_TRANSCODE = "ARCHIVE_TRANSCODE";

export const InputSchema = z.object({
    fileId: z.uuid(),
});

export const archiveTranscodeProcessor = defineProcessor(
    ARCHIVE_TRANSCODE,
    InputSchema,
    async (input) => {
        return transcode(input.payload.fileId);
    },
);

export const ArchiveTranscodeEvents = createEventCodes(ARCHIVE_TRANSCODE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            fileId: z.uuid(),
        }),
    },
]);
