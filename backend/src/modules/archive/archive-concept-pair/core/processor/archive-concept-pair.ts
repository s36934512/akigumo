import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { ArchiveConceptPairSchema } from "../../api/schema.js";
import { prepareArchiveConceptPair } from "../preparation.js";
import {
    ConceptPairAssociationSchema,
    ConceptRegistryWithIdSchema,
} from "../schema.js";
import * as service from "../service.js";

export const ARCHIVE_CONCEPT_PAIR = "ARCHIVE_CONCEPT_PAIR";

export const archiveConceptPairProcessor = defineProcessor(
    ARCHIVE_CONCEPT_PAIR,
    ArchiveConceptPairSchema.array,
    async (input) => {
        const { conceptPool, pairAssociationList } = prepareArchiveConceptPair(
            input.payload,
        );

        await service.createConceptBatch(conceptPool);

        return { conceptPool, pairAssociationList };
    },
);

export const ArchiveConceptPairEvent = defineEventContract(
    ARCHIVE_CONCEPT_PAIR,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                conceptPool: ConceptRegistryWithIdSchema.array(),
                pairAssociationList: ConceptPairAssociationSchema.array,
            }),
        },
    ],
);
