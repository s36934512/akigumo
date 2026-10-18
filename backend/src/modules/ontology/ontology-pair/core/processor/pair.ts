import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { OntologyPairSchema } from "../../api/schema.js";
import { prepareConceptPair } from "../preparation.js";
import {
    ConceptPairAssociationSchema,
    ConceptRegistryWithIdSchema,
} from "../schema.js";
import * as service from "../service.js";

export const ONTOLOGY_PAIR = "ONTOLOGY_PAIR";

export const ontologyPairProcessor = defineProcessor(
    ONTOLOGY_PAIR,
    OntologyPairSchema.array,
    async (input) => {
        const { conceptPool, pairAssociationList } = prepareConceptPair(
            input.payload,
        );

        await service.createConceptBatch(conceptPool);

        return { conceptPool, pairAssociationList };
    },
);

export const OntologyPairEvent = defineEventContract(ONTOLOGY_PAIR, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            conceptPool: ConceptRegistryWithIdSchema.array(),
            pairAssociationList: ConceptPairAssociationSchema.array,
        }),
    },
]);
