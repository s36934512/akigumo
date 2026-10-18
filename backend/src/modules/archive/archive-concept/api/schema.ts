import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const ArchiveConceptSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid().openapi({
            description: "目標archive",
            example: "01a05759-5fea-766a-87ee-ca68fb72a6ca",
        }),
        conceptIdList: z.uuid().array(),
        newConceptList: ConceptRegistrySchema.array,
    }),
);

export type ArchiveConcept = InferFlexible<typeof ArchiveConceptSchema>;

export const RequestSchema = ArchiveConceptSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
