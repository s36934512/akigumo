import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const ArchiveConceptRemoveSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid().openapi({
            description: "目標archive",
            example: "01a05759-5fea-766a-87ee-ca68fb72a6ca",
        }),
        conceptIdList: z.uuid().array(),
    }),
);

export type ArchiveConceptRemove = InferFlexible<
    typeof ArchiveConceptRemoveSchema
>;

export const RequestSchema = ArchiveConceptRemoveSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
