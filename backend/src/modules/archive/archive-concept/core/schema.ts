import { z } from "zod";

import { ConceptRegistrySchema } from "#app/contracts/index.js";
import { createFlexibleSchema } from "#app/schema/index.js";

export const ConceptAssociationSchema = createFlexibleSchema(
    z.object({
        targetId: z.uuid(),
        conceptIdList: z.uuid().array(),
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
