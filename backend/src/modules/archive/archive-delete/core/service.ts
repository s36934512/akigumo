import { prisma } from "#app/infrastructure/database/prisma.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";
import { uniqueArray } from "#app/utils/array.js";

import type { ArchiveDescendantPath } from "./graph-repository.js";

type ArchiveDeletionCandidate = {
    rootArchiveId: string;
    archiveIdList: string[];
};

function resolveDeletionCandidateList(
    pathList: ArchiveDescendantPath[],
    activeArchiveIdSet: Set<string>,
): ArchiveDeletionCandidate[] {
    const candidateList: ArchiveDeletionCandidate[] = [];

    for (const { rootArchiveId, descendantPathList } of pathList) {
        if (!activeArchiveIdSet.has(rootArchiveId)) {
            continue;
        }

        const archiveIdSet = new Set([rootArchiveId]);

        for (const descendant of descendantPathList) {
            if (
                descendant.pathArchiveIdList.every((archiveId) =>
                    activeArchiveIdSet.has(archiveId),
                )
            ) {
                archiveIdSet.add(descendant.archiveId);
            }
        }

        candidateList.push({
            rootArchiveId,
            archiveIdList: [...archiveIdSet],
        });
    }

    return candidateList;
}

/**
 * 如果某個選取根節點已經包含在另一個選取根節點的刪除範圍，
 * 就不再為它建立獨立 Deletion。
 */
function normalizeDeletionCandidateList(
    candidateList: ArchiveDeletionCandidate[],
): ArchiveDeletionCandidate[] {
    const independentCandidateList = candidateList.filter(
        ({ rootArchiveId }) =>
            !candidateList.some(
                (candidate) =>
                    candidate.rootArchiveId !== rootArchiveId &&
                    candidate.archiveIdList.includes(rootArchiveId),
            ),
    );

    const ownerByArchiveId = new Map<string, string>();

    for (const candidate of independentCandidateList) {
        for (const archiveId of candidate.archiveIdList) {
            const ownerRootId = ownerByArchiveId.get(archiveId);

            if (ownerRootId && ownerRootId !== candidate.rootArchiveId) {
                throw new Error(
                    `Archive ${archiveId} belongs to multiple deletion roots.`,
                );
            }

            ownerByArchiveId.set(archiveId, candidate.rootArchiveId);
        }
    }

    return independentCandidateList;
}

export async function createArchiveDeletion(pathList: ArchiveDescendantPath[]) {
    const candidateIdList = uniqueArray(
        pathList.flatMap(({ rootArchiveId, descendantPathList }) => [
            rootArchiveId,
            ...descendantPathList.flatMap(
                ({ pathArchiveIdList }) => pathArchiveIdList,
            ),
        ]),
    );

    return prisma.$transaction(async (tx) => {
        const activeArchiveList = await tx.archive.findMany({
            where: {
                id: {
                    in: candidateIdList,
                },
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        const activeArchiveIdSet = new Set(
            activeArchiveList.map(({ id }) => id),
        );

        const candidateList = normalizeDeletionCandidateList(
            resolveDeletionCandidateList(pathList, activeArchiveIdSet),
        );

        if (candidateList.length === 0) {
            return {
                deletionIdList: [],
                archiveIdList: [],
            };
        }

        const archiveIdList = uniqueArray(
            candidateList.flatMap(({ archiveIdList }) => archiveIdList),
        );

        const deletedAt = new Date();

        // 先更新 Archive，利用 UPDATE 的列鎖與 deletedAt 條件
        // 防止並行 Workflow 對同一批 Archive 重複刪除。
        const updatedArchiveList = await tx.archive.updateManyAndReturn({
            where: {
                id: {
                    in: archiveIdList,
                },
                deletedAt: null,
            },
            data: {
                deletedAt,
            },
            select: {
                id: true,
            },
        });

        if (updatedArchiveList.length !== archiveIdList.length) {
            throw new Error(
                "Archive deletion scope changed during processing.",
            );
        }

        const deletionIdList: string[] = [];

        for (const candidate of candidateList) {
            const deletion = await tx.archiveDeletion.create({
                data: {
                    rootArchiveId: candidate.rootArchiveId,
                    deletedAt,
                },
                select: {
                    id: true,
                },
            });

            await tx.archiveDeletionItem.createMany({
                data: candidate.archiveIdList.map((archiveId) => ({
                    deletionId: deletion.id,
                    archiveId,
                })),
            });

            deletionIdList.push(deletion.id);
        }

        await enqueueBatch(
            tx,
            updatedArchiveList.map(({ id }) => ({
                entityType: "ARCHIVE",
                entityId: id,
                operation: "DELETE",
            })),
        );

        return {
            deletionIdList,
            archiveIdList: updatedArchiveList.map(({ id }) => id),
        };
    });
}
