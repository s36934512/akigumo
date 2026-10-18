import { prisma } from "#app/infrastructure/database/prisma.js";

import type { ConceptRegistryWithId } from "./schema.js";

export async function createConceptBatch(conceptList: ConceptRegistryWithId[]) {
    await prisma.concept.createMany({
        data: conceptList,
    });
}
