import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";

import { OntologyDeleteSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_DELETE = "ONTOLOGY_DELETE";

export const ontologyDeleteProcessor = defineProcessor(
    ONTOLOGY_DELETE,
    OntologyDeleteSchema.single,
    async (input) => {
        const conceptIdList = await service.updateConceptList(
            input.payload.idList,
        );

        return { conceptIdList };
    },
);

export const OntologyDeleteEvent = defineEventContract(ONTOLOGY_DELETE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            conceptIdList: z.uuid().array(),
        }),
    },
]);
