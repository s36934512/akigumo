import { prisma } from "#app/infrastructure/database/prisma.js";

import type { ConceptRegistryWithId } from "./type.js";

export async function createConceptList(conceptList: ConceptRegistryWithId[]) {
    await prisma.concept.createMany({
        data: conceptList,
    });
}
