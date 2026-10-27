import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";

export const StrategySchema = z.object({
    shouldUncompress: z.boolean(),
    shouldTranscode: z.boolean(),
});

export const ArchiveIntegrationBootstrapEvent = defineEventContract(
    WORKFLOW_BOOTSTRAP,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                fileId: z.uuid(),
                strategy: StrategySchema,
                remainingUncompressDepth: z.int().min(0).max(3),
                parentWorkflowId: z.uuid().optional(),
            }),
        },
    ],
);
