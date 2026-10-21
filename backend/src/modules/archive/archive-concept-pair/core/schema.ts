import { z } from "zod";

import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema } from "#app/schema/index.js";

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

export const ConceptRegistryWithIdSchema = ConceptRegistrySchema.single.extend({
    id: z.uuid(),
});

export type ConceptRegistryWithId = z.infer<typeof ConceptRegistryWithIdSchema>;

export const ConceptRegistryWithTempIdSchema =
    ConceptRegistrySchema.single.extend({
        _tempId: z.uuid(),
    });

export type ConceptRegistryWithTempId = z.infer<
    typeof ConceptRegistryWithTempIdSchema
>;

export type IdObject = { id: string };
