import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveDeleteSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ARCHIVE_DELETE = "ARCHIVE_DELETE";

export const archiveDeleteProcessor = defineProcessor(
    ARCHIVE_DELETE,
    ArchiveDeleteSchema.single,
    async (input) => {
        const archiveIdList = await service.updateArchiveList(
            input.payload.archiveIdList,
        );

        return { archiveIdList };
    },
);

export const ArchiveDeleteEvent = defineEventContract(ARCHIVE_DELETE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            archiveIdList: z.uuid().array(),
        }),
    },
]);
