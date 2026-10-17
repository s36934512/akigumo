import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { OntologyRegistrySchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_REGISTRY = "ONTOLOGY_REGISTRY";

export const ontologyRegistryProcessor = defineProcessor(
    ONTOLOGY_REGISTRY,
    OntologyRegistrySchema.single,
    async (input) => {
        const conceptIdList = await service.createConceptBatch(
            input.payload.registryList,
        );

        return { conceptIdList };
    },
);

export const OntologyRegistryEvent = defineEventContract(ONTOLOGY_REGISTRY, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            conceptIdList: z.uuid().array(),
        }),
    },
]);
