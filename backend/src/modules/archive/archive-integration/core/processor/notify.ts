import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import * as service from "../notify.js";
import { ARCHIVE_CHILD_COMPLETION_REPORTED } from "../notify.js";

export const ARCHIVE_NOTIFY = "ARCHIVE_NOTIFY";

export const ChildCompletionReportedSchema = z.object({
    fileId: z.uuid(),
    succeeded: z.boolean(),
});

export const NotifyInputSchema = ChildCompletionReportedSchema.extend({
    parentWorkflowId: z.uuid(),
});

export const archiveNotifyProcessor = defineProcessor(
    ARCHIVE_NOTIFY,
    NotifyInputSchema,
    async (input) => {
        return await service.notify(input.payload);
    },
);
export const ArchiveNotifyEvent = defineEventContract(ARCHIVE_NOTIFY, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({}),
    },
]);

export const archiveChildCompletionReportedProcessor = defineProcessor(
    ARCHIVE_CHILD_COMPLETION_REPORTED,
    ChildCompletionReportedSchema,
    async (input) => {
        return input.payload;
    },
);

export const ArchiveNotifyBootstrapEvent = defineEventContract(
    ARCHIVE_CHILD_COMPLETION_REPORTED,
    [
        {
            code: "SUCCEEDED",
            dataSchema: ChildCompletionReportedSchema,
        },
    ],
);
