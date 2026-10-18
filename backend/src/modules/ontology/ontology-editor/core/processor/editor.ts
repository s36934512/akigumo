import { z } from "zod";
import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";
import { OntologyEditorSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_EDITOR = "ONTOLOGY_EDITOR";

export const ontologyEditorProcessor = defineProcessor(
    ONTOLOGY_EDITOR,
    OntologyEditorSchema.single,
    async (input) => {
        const conceptIdList = await service.updateConceptList(input.payload);

        return { conceptIdList };
    },
);

export const OntologyEditorEvent = defineEventContract(ONTOLOGY_EDITOR, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            conceptIdList: z.uuid().array(),
        }),
    },
]);
