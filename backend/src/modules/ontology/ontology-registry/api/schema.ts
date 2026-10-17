import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const OntologyRegistrySchema = createFlexibleSchema(
    z.object({
        registryList: ConceptRegistrySchema.array,
    }),
);

export type OntologyRegistry = InferFlexible<typeof OntologyRegistrySchema>;

export const RequestSchema = OntologyRegistrySchema.single;

export const ResponseSchema = WorkflowResponseSchema;
