import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

import type { OntologyEditor } from "../api/schema.js";

export async function updateConceptList(input: OntologyEditor["single"]) {
    const conceptList = input.registryList;

    return prisma.$transaction(async (tx) => {
        const updated = await Promise.all(
            conceptList.map((concept) =>
                tx.concept.update({
                    where: { id: concept.id },
                    data: {
                        name: concept.registry.name,
                        description: concept.registry.description,
                        metadata: concept.registry.metadata,
                    },
                }),
            ),
        );

        await enqueueBatch(
            tx,
            updated.map((record) => ({
                entityType: "CONCEPT",
                entityId: record.id,
                operation: "UPSERT",
            })),
        );

        return updated.map((record) => record.id);
    });
}
