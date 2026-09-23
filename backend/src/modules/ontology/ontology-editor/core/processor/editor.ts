import { z } from "zod";

import { defineProcessor } from "#app/kernel/index.js";
import { createEventCodes } from "#app/shared/contracts/index.js";

import { OntologyEditorSchema } from "../../api/schema.js";
import * as service from "../service.js";

export const ONTOLOGY_EDITOR = "ONTOLOGY_EDITOR";

export const ontologyEditorProcessor = defineProcessor(
    ONTOLOGY_EDITOR,
    OntologyEditorSchema.single,
    async (input) => {
        const idList = await service.updateConceptList(input.payload);

        return { notifyId: input.payload.notifyId, idList };
    },
);

export const OntologyEditorEvents = createEventCodes(ONTOLOGY_EDITOR, [
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
