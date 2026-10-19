import { z } from "@hono/zod-openapi";

import { ConceptRegistrySchema } from "#app/contracts/index.js";

const ConceptRegistryWithIdSchema = ConceptRegistrySchema.single.extend({
    id: z.uuid(),
});

type ConceptRegistryWithId = z.infer<typeof ConceptRegistryWithIdSchema>;

export const EntrySchema = z.object({
    conceptPool: ConceptRegistryWithIdSchema.array(),
    associationList: z
        .object({
            targetId: z.uuid(),
            conceptIdList: z.uuid().array(),
        })
        .array(),
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
