import { v5 as uuidv5 } from "uuid";

import type { ConceptRegistry } from "#app/contracts/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { ONTOLOGY_NAMESPACE } from "../../constants.js";

export async function createConceptList(conceptList: ConceptRegistry["array"]) {
    const created = await prisma.concept.createManyAndReturn({
        data: conceptList.map((concept) => ({
            id: uuidv5(concept.name, ONTOLOGY_NAMESPACE),
            name: concept.name,
            description: concept.description,
            metadata: concept.metadata,
        })),
        skipDuplicates: true,
    });

    return created.map((r) => r.id);
}
