import { z } from "zod";

import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

import { TypeConstrainedRecordSchema } from "../common/record.js";

export const ConceptRegistrySchema = createFlexibleSchema(
    z.object({
        name: z.string().min(1, "名稱不能為空"),
        description: z.string().optional(),
        metadata: TypeConstrainedRecordSchema.optional(),
    }),
);
export type ConceptRegistry = InferFlexible<typeof ConceptRegistrySchema>;
