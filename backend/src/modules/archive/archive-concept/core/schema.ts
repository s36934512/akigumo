import { z } from "zod";

import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema } from "#app/schema/index.js";

export const PoolSchema = ConceptRegistrySchema.single.extend({
    id: z.uuid(),
});

export const ArchiveConceptEntrySchema = createFlexibleSchema(
    z.object({
        targetIdList: z.uuid().array(),
        metadataList: z
            .object({
                key: z.uuid(),
                value: z.uuid().array(),
            })
            .array(),
    }),
);
