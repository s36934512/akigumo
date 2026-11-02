import { z } from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { ConceptListSchema } from "../api/schema.js";
import { getChildrenCypher } from "./cypher.js";

const activeDeletionWhere = {
    restoredAt: null,
    permanentlyDeletedAt: null,
};

export async function getTrashRootList() {
    const deletionList = await prisma.archiveDeletion.findMany({
        where: activeDeletionWhere,
        orderBy: {
            deletedAt: "desc",
        },
        select: {
            id: true,
            rootArchiveId: true,
            deletedAt: true,
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

    const rootArchiveIdList = deletionList.map(
        ({ rootArchiveId }) => rootArchiveId,
    );

    const archiveList = await prisma.archive.findMany({
        where: {
            id: {
                in: rootArchiveIdList,
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
            publishedDate: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const archiveMap = new Map(
        archiveList.map((archive) => [archive.id, archive]),
    );

    return deletionList.map((deletion) => ({
        id: deletion.id,
        rootArchiveId: deletion.rootArchiveId,
        deletedAt: deletion.deletedAt,
        archive: archiveMap.get(deletion.rootArchiveId) ?? null,
        archiveCount: deletion.itemList.length,
    }));
}

export async function getTrashChildren(parentId: string) {
    const item = await prisma.archiveDeletionItem.findFirst({
        where: {
            archiveId: parentId,
            resolvedAt: null,
            deletion: {
                is: activeDeletionWhere,
            },
        },
        select: {
            deletion: {
                select: {
                    itemList: {
                        where: {
                            resolvedAt: null,
                        },
                        select: {
                            archiveId: true,
                        },
                    },
                },
            },
        },
    });

    if (!item) {
        return [];
    }

    const archiveIdList = item.deletion.itemList.map(
        ({ archiveId }) => archiveId,
    );

    return getChildrenFromGraph(parentId, archiveIdList);
}

async function getChildrenFromGraph(parentId: string, archiveIdList: string[]) {
    if (archiveIdList.length === 0) {
        return [];
    }

    const { records } = await driver.executeQuery(
        getChildrenCypher,
        {
            parentId,
            archiveIdList,
        },
        { database: "neo4j" },
    );

    const structure = records.map((r) => ({
        id: z.uuid().parse(r.get("archiveId")),
        currentFileId: z.uuid().nullable().parse(r.get("currentFileId")),
        conceptList: ConceptListSchema.parse(r.get("conceptList")),
    }));

    const archiveList = await prisma.archive.findMany({
        where: {
            id: {
                in: structure.map(({ id }) => id),
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
            publishedDate: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const archiveMap = new Map(
        archiveList.map((archive) => [archive.id, archive]),
    );

    return structure.flatMap((item) => {
        const archive = archiveMap.get(item.id);

        return archive ? [{ ...archive, ...item }] : [];
    });
}
