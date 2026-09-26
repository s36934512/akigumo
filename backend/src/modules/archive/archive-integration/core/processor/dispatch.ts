import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { dispatchFile } from "../dispatch.js";

export const ARCHIVE_DISPATCH = "ARCHIVE_DISPATCH";

export const DispatchInputSchema = z.object({
    fileId: z.uuid(),
    uncompressMaxDepth: z.number().default(3),
    correlationId: z.uuid().optional(),
    notifyId: z.uuid().optional(),
});

export const archiveDispatchProcessor = defineProcessor(
    ARCHIVE_DISPATCH,
    DispatchInputSchema,
    async (input) => {
        return dispatchFile(input.payload);
    },
);

export const ArchiveDispatchEvents = createEventCodes(ARCHIVE_DISPATCH, [
    {
        code: "SUCCEEDED",
        resultSchema: z.object({
            fileId: z.uuid(),
            strategy: z.string(),
            uncompressMaxDepth: z.int(),
            extensionCode: z.string(),
            conceptId: z.uuid(),
            notifyId: z.uuid(),
        }),
    },
    {
        code: "FAILED",
        resultSchema: z.object({
            reason: z.string(),
        }),
    },
]);
