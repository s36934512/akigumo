import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { transcode } from "../transcode.js";

export const ARCHIVE_TRANSCODE = "ARCHIVE_TRANSCODE";

const InputSchema = z.uuid();

export const archiveTranscodeProcessor = defineProcessor(
    ARCHIVE_TRANSCODE,
    InputSchema,
    async (input) => {
        return transcode(input.payload);
    },
);

export const ArchiveTranscodeEvents = createEventCodes(ARCHIVE_TRANSCODE, [
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
