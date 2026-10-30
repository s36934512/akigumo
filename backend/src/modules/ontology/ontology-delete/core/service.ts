import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

export async function updateConceptList(idList: string[]) {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.concept.updateManyAndReturn({
            where: {
                id: {
                    in: idList,
                },
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        await enqueueBatch(
            tx,
            updated.map((record) => ({
                entityType: "CONCEPT",
                entityId: record.id,
                operation: "DELETE",
            })),
        );

        return updated.map((record) => record.id);
    });
}
