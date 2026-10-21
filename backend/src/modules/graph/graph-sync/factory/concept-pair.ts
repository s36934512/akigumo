import { z } from "@hono/zod-openapi";

import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema } from "#app/schema/index.js";

const ConceptRegistryWithIdSchema = ConceptRegistrySchema.single.extend({
    id: z.uuid(),
});

type ConceptRegistryWithId = z.infer<typeof ConceptRegistryWithIdSchema>;

const ConceptPairItemSchema = z.object({
    statement: z.uuid(),
    value: z.uuid().array(),
});

export const ConceptPairAssociationSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid(),
        conceptPairList: ConceptPairItemSchema.array(),
    }),
);

export const EntrySchema = z.object({
    conceptPool: ConceptRegistryWithIdSchema.array(),
    pairAssociationList: ConceptPairAssociationSchema.array,
});

const PoolTaskPayloadSchema = ConceptRegistryWithIdSchema.transform((data) => {
    return {
        conceptId: data.id,
        conceptProps: {
            name: data.name ?? null,
        },
    };
});

export function buildConceptPoolTask(payload: ConceptRegistryWithId) {
    return PoolTaskPayloadSchema.parse(payload);
}
