import { z } from "zod";

import { ArchiveTypeSchema } from "#app/generated/zod/schemas/enums/ArchiveType.schema.js";
import { driver } from "#app/infrastructure/database/neo4j.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { ConceptListSchema } from "../api/schema.js";
import { getArchiveGraphInfoCypher, getChildrenCypher } from "./cypher.js";

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

    const archiveGraphInfoList = await getArchiveGraphInfo(rootArchiveIdList);

    const archiveGraphInfoMap = new Map(
        archiveGraphInfoList.map((item) => [item.id, item]),
    );

    return {
        type: "trash" as const,
        deletionList: deletionList.map((deletion) => {
            const archive = archiveMap.get(deletion.rootArchiveId);
            const graphInfo = archiveGraphInfoMap.get(deletion.rootArchiveId);

            if (!archive || !graphInfo) {
                return {
                    id: deletion.id,
                    rootArchiveId: deletion.rootArchiveId,
                    deletedAt: deletion.deletedAt,
                    archiveCount: deletion.itemList.length,
                };
            }

            return {
                id: deletion.id,
                rootArchiveId: deletion.rootArchiveId,
                deletedAt: deletion.deletedAt,
                archive: {
                    ...archive,
                    ...graphInfo,
                    ...(archive.type === ArchiveTypeSchema.enum.FILE_CONTAINER
                        ? {}
                        : { count: graphInfo.count }),
                },
                archiveCount: deletion.itemList.length,
            };
        }),
    };
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
        return {
            type: "children" as const,
            archiveList: [],
        };
    }

    const archiveIdList = item.deletion.itemList.map(
        ({ archiveId }) => archiveId,
    );

    return {
        type: "children" as const,
        archiveList: await getChildrenFromGraph(parentId, archiveIdList),
    };
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
        count: parseNeo4jInteger(r.get("count")),
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

        if (!archive) {
            return [];
        }

        return [
            {
                ...archive,
                ...item,
                ...(archive.type === ArchiveTypeSchema.enum.FILE_CONTAINER
                    ? {}
                    : { count: item.count }),
            },
        ];
    });
}

async function getArchiveGraphInfo(archiveIdList: string[]) {
    if (archiveIdList.length === 0) {
        return [];
    }

    const { records } = await driver.executeQuery(
        getArchiveGraphInfoCypher,
        { archiveIdList },
        { database: "neo4j" },
    );

    return records.map((r) => ({
        id: z.uuid().parse(r.get("archiveId")),
        currentFileId: z.uuid().nullable().parse(r.get("currentFileId")),
        conceptList: ConceptListSchema.parse(r.get("conceptList")),
        count: parseNeo4jInteger(r.get("count")),
    }));
}

function parseNeo4jInteger(value: unknown): number {
    if (typeof value === "number") {
        return value;
    }

    if (
        typeof value === "object" &&
        value !== null &&
        "toNumber" in value &&
        typeof value.toNumber === "function"
    ) {
        return value.toNumber();
    }

    throw new Error("Invalid Neo4j integer");
}
