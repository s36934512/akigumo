import { z } from "zod";

import { defineProcessor } from "#app/kernel/index.js";
import { createEventCodes } from "#app/shared/contracts/index.js";

import { OntologyDeleteSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_DELETE = "ONTOLOGY_DELETE";

export const ontologyDeleteProcessor = defineProcessor(
    ONTOLOGY_DELETE,
    OntologyDeleteSchema.single,
    async (input) => {
        const idList = await service.updateConceptList(input.payload.idList);

        return { notifyId: input.payload.notifyId, idList };
    },
);

export const OntologyDeleteEvents = createEventCodes(ONTOLOGY_DELETE, [
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
