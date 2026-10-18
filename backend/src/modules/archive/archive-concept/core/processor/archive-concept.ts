import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveConceptSchema } from "../../api/schema.js";
import { prepareArchiveConcept } from "../preparation.js";
import {
    ConceptAssociationSchema,
    ConceptRegistryWithIdSchema,
} from "../schema.js";
import * as service from "../service.js";

export const ARCHIVE_CONCEPT = "ARCHIVE_CONCEPT";

export const archiveConceptProcessor = defineProcessor(
    ARCHIVE_CONCEPT,
    ArchiveConceptSchema.array,
    async (input) => {
        const { conceptPool, associationList } = prepareArchiveConcept(
            input.payload,
        );

        await service.createConceptBatch(conceptPool);

        return { conceptPool, associationList };
    },
);

export const ArchiveConceptEvent = defineEventContract(ARCHIVE_CONCEPT, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            conceptPool: ConceptRegistryWithIdSchema.array(),
            associationList: ConceptAssociationSchema.array,
        }),
    },
]);
