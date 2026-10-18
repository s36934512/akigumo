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
        const idList = await service.updateArchiveList(input.payload.idList);

        return idList;
    },
);

export const ArchiveDeleteEvent = defineEventContract(ARCHIVE_DELETE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            idList: z.uuid().array(),
        }),
    },
]);
