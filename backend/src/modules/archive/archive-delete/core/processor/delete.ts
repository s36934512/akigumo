import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
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

export const ArchiveDeleteEvents = createEventCodes(ARCHIVE_DELETE, [
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
