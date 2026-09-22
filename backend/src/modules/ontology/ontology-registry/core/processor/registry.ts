import { z } from "zod";

import { defineProcessor } from "#app/kernel/index.js";
import { createEventCodes } from "#app/shared/contracts/index.js";

import { OntologyRegistrySchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_REGISTRY = "ONTOLOGY_REGISTRY";

export const ontologyRegistryProcessor = defineProcessor(
    ONTOLOGY_REGISTRY,
    OntologyRegistrySchema.single,
    async (input) => {
        const idList = await service.createConceptList(
            input.payload.registryList,
        );

        return { notifyId: input.payload.notifyId, idList };
    },
);

export const OntologyRegistryEvents = createEventCodes(ONTOLOGY_REGISTRY, [
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
