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

const ArchiveConceptPairItemSchema = createFlexibleSchema(
    z.object({
        statement: StatementInputSchema.single,
        value: z
            .object({ id: z.uuid() })
            .or(ConceptRegistrySchema.single)
            .array(),
    }),
);

export const ArchiveConceptPairSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid().openapi({
            description: "目標 Concept",
            example: "01a05759-5fea-766a-87ee-ca68fb72a6ca",
        }),
        pairList: ArchiveConceptPairItemSchema.array.openapi({
            description: "動態新增概念，用於增加尚未存在的屬性",
            example: [
                {
                    key: {
                        id: "048ea356-e8b7-5ff0-a582-1152cda9667a",
                    },
                    value: [
                        {
                            name: "eightzhuan",
                            metadata: { x: "https://x.com/eightzhuan" },
                        },
                    ],
                },
                {
                    key: { name: "原作" },
                    value: [
                        {
                            id: "01a025fa-4524-7660-aa3b-ce104ee37846",
                        },
                    ],
                },
            ],
        }),
    }),
);

export type ArchiveConceptPair = InferFlexible<typeof ArchiveConceptPairSchema>;

export const RequestSchema = ArchiveConceptPairSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
