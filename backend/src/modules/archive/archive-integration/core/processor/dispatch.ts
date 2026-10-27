import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { dispatchFile } from "../dispatch.js";

export const ARCHIVE_DISPATCH = "ARCHIVE_DISPATCH";

export const DispatchInputSchema = z.object({
    fileIdList: z.uuid().array(),
    remainingUncompressDepth: z.int().min(0).max(3).default(3),
    notifyParentOnCompletion: z.boolean().default(false),
});

export const archiveDispatchProcessor = defineProcessor(
    ARCHIVE_DISPATCH,
    DispatchInputSchema,
    async (input) => {
        const {
            fileIdList,
            remainingUncompressDepth,
            notifyParentOnCompletion,
        } = input.payload;

        if (notifyParentOnCompletion) {
            return dispatchFile({
                fileIdList,
                remainingUncompressDepth,
                parentWorkflowId: input.context.workflowId,
            });
        }

        return dispatchFile(input.payload);
    },
);

export const ArchiveDispatchEvent = defineEventContract(ARCHIVE_DISPATCH, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            fileIdList: z.uuid().array(),
        }),
    },
]);
