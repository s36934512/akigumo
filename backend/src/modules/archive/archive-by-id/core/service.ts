import { z } from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { query } from "./cypher.js";

export async function getArchiveById(archiveId: string) {
    const { records } = await driver.executeQuery(
        query,
        { id: archiveId },
        { database: "neo4j" },
    );

    const record = records[0];

    if (!record) return null;

    const structure = {
        id: z.uuid().parse(record.get("archiveId")),
        currentFileId: z.uuid().nullable().parse(record.get("currentFileId")),
        conceptList: record.get("conceptList"),
    };

    const archive = await prisma.archive.findUnique({
        where: {
            id: archiveId,
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

    if (!archive) return null;

    return {
        ...archive,
        ...structure,
    };
}
