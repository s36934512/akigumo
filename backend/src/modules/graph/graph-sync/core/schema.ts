import { z } from "zod";

import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const GraphSyncSchema = createFlexibleSchema(
    z.object({
        taskName: z.string(),
        payload: z.unknown(),
    }),
);

export type GraphSync = InferFlexible<typeof GraphSyncSchema>;
