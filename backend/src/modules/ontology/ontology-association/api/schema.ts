import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const OntologyAssociationSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid().openapi({
            description: "目標concept",
            example: "01a05759-5fea-766a-87ee-ca68fb72a6ca",
        }),
        conceptIdList: z.uuid().array(),
        newConceptList: ConceptRegistrySchema.array,
    }),
);

export type OntologyAssociation = InferFlexible<
    typeof OntologyAssociationSchema
>;

export const RequestSchema = OntologyAssociationSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
