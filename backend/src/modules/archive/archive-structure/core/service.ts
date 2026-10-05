import z from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { getChildrenCypher, getRootArchiveListCypher } from "./cypher.js";

export async function getArchiveStructureFromGraph({
    parentId,
    showDeleted,
}: {
    parentId?: string;
    showDeleted: boolean;
}) {
    const query = parentId ? getChildrenCypher : getRootArchiveListCypher;

    const { records } = await driver.executeQuery(
        query,
        { parentId, showDeleted },
        { database: "neo4j" },
    );

    const structure = records.map((r) => ({
        id: z.uuid().parse(r.get("archiveId")),
        currentFileId: z.uuid().nullable().parse(r.get("currentFileId")),
        conceptList: r.get("conceptList"),
    }));

    const archiveList = await prisma.archive.findMany({
        where: {
            id: {
                in: structure.map((i) => i.id),
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

    return structure.flatMap((archiveStructure) => {
        const archive = archiveMap.get(archiveStructure.id);

        if (!archive) return [];

        return [{ ...archive, ...archiveStructure }];
    });
}
