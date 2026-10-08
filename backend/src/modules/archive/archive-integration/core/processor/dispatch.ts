import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";

import { dispatchFile } from "../dispatch.js";

export const ARCHIVE_DISPATCH = "ARCHIVE_DISPATCH";

export const DispatchInputSchema = z.object({
    fileIdList: z.uuid().array(),
    uncompressMaxDepth: z.number().default(3),
    correlationId: z.uuid().optional(),
});

export const StrategySchema = z.object({
    shouldUncompress: z.boolean(),
    shouldTranscode: z.boolean(),
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
        dataSchema: z.object({
            fileIdList: z.uuid().array(),
        }),
    },
]);

export const ArchiveIntegrationBootstrapEvents = createEventCodes(
    WORKFLOW_BOOTSTRAP,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                fileId: z.uuid(),
                strategy: StrategySchema,
                uncompressMaxDepth: z.int(),
            }),
        },
    ],
);
