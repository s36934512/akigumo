import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";

export async function restoreArchiveDeletion(deletionIdList: string[]) {
    return prisma.$transaction(async (tx) => {
        const restoredAt = new Date();

        const restoredArchiveIdList: string[] = [];

        for (const deletionId of new Set(deletionIdList)) {
            const deletion = await tx.archiveDeletion.findFirst({
                where: {
                    id: deletionId,
                    restoredAt: null,
                    permanentlyDeletedAt: null,
                },
                select: {
                    id: true,
                    itemList: {
                        where: {
                            resolvedAt: null,
                        },
                        select: {
                            archiveId: true,
                        },
                    },
                },
            });

            if (!deletion) {
                continue;
            }

            const archiveIdList = deletion.itemList.map(
                ({ archiveId }) => archiveId,
            );

            // 先取得這筆 Deletion 的處理權
            const claimed = await tx.archiveDeletion.updateMany({
                where: {
                    id: deletionId,
                    restoredAt: null,
                    permanentlyDeletedAt: null,
                },
                data: {
                    restoredAt,
                },
            });

            if (claimed.count === 0) {
                continue;
            }

            if (archiveIdList.length > 0) {
                const updatedArchiveList = await tx.archive.updateManyAndReturn(
                    {
                        where: {
                            id: {
                                in: archiveIdList,
                            },
                            deletedAt: {
                                not: null,
                            },
                        },
                        data: {
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                        },
                    },
                );

                if (updatedArchiveList.length !== archiveIdList.length) {
                    throw new Error(
                        "Archive restoration scope changed during processing.",
                    );
                }

                restoredArchiveIdList.push(
                    ...updatedArchiveList.map(({ id }) => id),
                );

                const resolved = await tx.archiveDeletionItem.updateMany({
                    where: {
                        deletionId,
                        resolvedAt: null,
                    },
                    data: {
                        resolvedAt: restoredAt,
                        resolution: "RESTORED",
                    },
                });

                if (resolved.count !== archiveIdList.length) {
                    throw new Error(
                        "Archive deletion items changed during restoration.",
                    );
                }
            }
        }

        await enqueueBatch(
            tx,
            restoredArchiveIdList.map((id) => ({
                entityType: "ARCHIVE",
                entityId: id,
                operation: "UPSERT",
            })),
        );

        return restoredArchiveIdList;
    });
}
