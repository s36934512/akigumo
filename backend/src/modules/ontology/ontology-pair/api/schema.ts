import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

const ExistingStatementSchema = z.object({
    id: z.uuid(),
});

const NewStatementSchema = z.object({
    name: z.string(),
});

const StatementInputSchema = createFlexibleSchema(
    ExistingStatementSchema.or(NewStatementSchema),
);

const OntologyPairItemSchema = createFlexibleSchema(
    z.object({
        statement: StatementInputSchema.single,
        value: z
            .object({ id: z.uuid() })
            .or(ConceptRegistrySchema.single)
            .array(),
    }),
);

export const OntologyPairSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid().openapi({
            description: "目標 Concept",
            example: "01a05759-5fea-766a-87ee-ca68fb72a6ca",
        }),
        pairList: OntologyPairItemSchema.array,
    }),
);

export type OntologyPair = InferFlexible<typeof OntologyPairSchema>;

export const RequestSchema = OntologyPairSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
