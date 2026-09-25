import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

const RelationTypeSchema = createFlexibleSchema(
    z
        .object({ id: z.uuid() })
        .or(z.object({ name: z.string(), id: z.uuid().optional() })),
);

const MetadataSchema = createFlexibleSchema(
    z.object({
        key: RelationTypeSchema.single,
        value: z
            .object({ id: z.uuid() })
            .or(ConceptRegistrySchema.single)
            .array(),
    }),
);

export const ArchiveConceptSchema = createFlexibleSchema(
    z.object({
        targetIdList: z
            .uuid()
            .array()
            .min(1, "目標不能為空")
            .openapi({
                description: "目標archive",
                example: ["01a05759-5fea-766a-87ee-ca68fb72a6ca"],
            }),
        metadataList: MetadataSchema.array.optional().openapi({
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

export type ArchiveConcept = InferFlexible<typeof ArchiveConceptSchema>;

export const RequestSchema = ArchiveConceptSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
