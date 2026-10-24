import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const ArchiveDeleteSchema = createFlexibleSchema(
    z.object({
        archiveIdList: z.array(z.uuid()).min(1),
    }),
);

export type ArchiveDelete = InferFlexible<typeof ArchiveDeleteSchema>;

export const RequestSchema = ArchiveDeleteSchema.single;

export const ResponseSchema = WorkflowResponseSchema;
