import { v5 as uuidv5 } from "uuid";

import type { ConceptRegistry } from "#app/contracts/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

import { ONTOLOGY_NAMESPACE } from "../../constants.js";

export async function createConceptBatch(
    conceptList: ConceptRegistry["array"],
) {
    return prisma.$transaction(async (tx) => {
        const created = await tx.concept.createManyAndReturn({
            data: conceptList.map((concept) => ({
                id: uuidv5(concept.name, ONTOLOGY_NAMESPACE),
                name: concept.name,
                description: concept.description,
                metadata: concept.metadata,
            })),
            skipDuplicates: true,
        });

        await enqueueBatch(
            tx,
            created.map((record) => ({
                entityType: "CONCEPT",
                entityId: record.id,
                operation: "UPSERT",
            })),
        );

        return created.map((record) => record.id);
    });
}
