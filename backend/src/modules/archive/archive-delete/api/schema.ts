import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const ArchiveDeleteSchema = createFlexibleSchema(
    z.object({
        notifyId: z.uuid(),
        idList: z.uuid().array(),
    }),
);

export type ArchiveDelete = InferFlexible<typeof ArchiveDeleteSchema>;

export const RequestSchema = ArchiveDeleteSchema.array;

export const ResponseSchema = WorkflowResponseSchema;
