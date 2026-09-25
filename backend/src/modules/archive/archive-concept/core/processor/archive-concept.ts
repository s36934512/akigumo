import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveConceptSchema } from "../../api/schema.js";
import { prepareArchiveConcept } from "../preparation.js";
import { ArchiveConceptEntrySchema, PoolSchema } from "../schema.js";
import * as service from "../service.js";

export const ARCHIVE_CONCEPT = "ARCHIVE_CONCEPT";

export const archiveConceptProcessor = defineProcessor(
    ARCHIVE_CONCEPT,
    ArchiveConceptSchema.array,
    async (input) => {
        const { pool, entryList } = prepareArchiveConcept(input.payload);

        await service.createConceptList(pool);

        return { pool, entryList };
    },
);

export const ArchiveConceptEvents = createEventCodes(ARCHIVE_CONCEPT, [
    {
        code: "SUCCEEDED",
        resultSchema: z.object({
            pool: PoolSchema.array(),
            entryList: ArchiveConceptEntrySchema.array,
        }),
    },
    {
        code: "FAILED",
        resultSchema: z.object({
            reason: z.string(),
        }),
    },
]);
