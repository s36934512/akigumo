import { z } from "zod";

import { defineEventContract } from "#app/contracts/workflow.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveRestoreSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ARCHIVE_RESTORE = "ARCHIVE_RESTORE";

export const archiveRestoreProcessor = defineProcessor(
    ARCHIVE_RESTORE,
    ArchiveRestoreSchema.single,
    async (input) => {
        const archiveIdList = await service.restoreArchiveDeletion(
            input.payload.deletionIdList,
        );

        return { archiveIdList };
    },
);

export const ArchiveRestoreEvent = defineEventContract(ARCHIVE_RESTORE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            archiveIdList: z.uuid().array(),
        }),
    },
]);
