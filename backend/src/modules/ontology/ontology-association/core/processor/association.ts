import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { OntologyAssociationSchema } from "../../api/schema.js";
import { prepareConceptAssociation } from "../preparation.js";
import {
    ConceptAssociationSchema,
    ConceptRegistryWithIdSchema,
} from "../schema.js";
import * as service from "../service.js";

export const ONTOLOGY_ASSOCIATION = "ONTOLOGY_ASSOCIATION";

export const ontologyAssociationProcessor = defineProcessor(
    ONTOLOGY_ASSOCIATION,
    OntologyAssociationSchema.array,
    async (input) => {
        const { conceptPool, associationList } = prepareConceptAssociation(
            input.payload,
        );

        await service.createConceptBatch(conceptPool);

        return { conceptPool, associationList };
    },
);

export const OntologyAssociationEvent = defineEventContract(
    ONTOLOGY_ASSOCIATION,
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.object({
                conceptPool: ConceptRegistryWithIdSchema.array(),
                associationList: ConceptAssociationSchema.array,
            }),
        },
    ],
);
