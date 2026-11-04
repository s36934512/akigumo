import { z } from "zod";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const ArchiveRestoreSchema = createFlexibleSchema(
    z.object({
        deletionIdList: z.array(z.uuid()).min(1),
    }),
);

export type ArchiveRestore = InferFlexible<typeof ArchiveRestoreSchema>;

export const RequestSchema = ArchiveRestoreSchema.single;

export const ResponseSchema = WorkflowResponseSchema;
