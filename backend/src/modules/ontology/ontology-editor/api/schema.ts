import { z } from "zod";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import {
    createFlexibleSchema,
    type InferFlexible,
} from "#app/shared/contracts/index.js";

const ConceptEditSchema = createFlexibleSchema(
    z.object({
        id: z.uuid(),
        registry: ConceptRegistrySchema.single,
    }),
);

export const OntologyEditorSchema = createFlexibleSchema(
    z.object({
        notifyId: z.uuid(),
        registryList: ConceptEditSchema.array,
    }),
);

export type OntologyEditor = InferFlexible<typeof OntologyEditorSchema>;

export const RequestSchema = OntologyEditorSchema.single;

export const ResponseSchema = WorkflowResponseSchema;
