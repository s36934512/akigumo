import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveConceptSchema } from "../../api/schema.js";
import { prepareArchiveConcept } from "../preparation.js";
import { ArchiveConceptEntrySchema, PoolSchema } from "../schema.js";
import * as service from "../service.js";

export const ARCHIVE_CONCEPT_PAIR = "ARCHIVE_CONCEPT_PAIR";

export const archiveConceptPairProcessor = defineProcessor(
    ARCHIVE_CONCEPT_PAIR,
    ArchiveConceptSchema.array,
    async (input) => {
        const { pool, entryList } = prepareArchiveConcept(input.payload);

        await service.createConceptList(pool);

        return { pool, entryList };
    },
);

export const ArchiveConceptPairEvent = defineEventContract(
    ARCHIVE_CONCEPT_PAIR,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                pool: PoolSchema.array(),
                entryList: ArchiveConceptEntrySchema.array,
            }),
        },
    ],
);
