import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

export async function updateArchiveList(idList: string[]) {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.archive.updateManyAndReturn({
            where: {
                id: {
                    in: idList,
                },
                deletedAt: {
                    not: null,
                },
            },
            data: {
                deletedAt: null,
            },
        });

        await enqueueBatch(
            tx,
            updated.map((archive) => ({
                entityType: "ARCHIVE",
                entityId: archive.id,
                operation: "UPSERT",
            })),
        );

        return updated.map((archive) => archive.id);
    });
}
