import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

import type { ConceptRegistryWithId } from "./schema.js";

export async function createConceptBatch(conceptList: ConceptRegistryWithId[]) {
    await prisma.$transaction(async (tx) => {
        await tx.concept.createMany({
            data: conceptList,
        });

        await enqueueBatch(
            tx,
            conceptList.map((concept) => ({
                entityType: "CONCEPT",
                entityId: concept.id,
                operation: "UPSERT",
            })),
        );
    });
}
