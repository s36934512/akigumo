import { z } from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";

import { getArchiveDescendantPathListCypher } from "./cypher.js";

const DescendantPathSchema = z.object({
    archiveId: z.uuid(),
    pathArchiveIdList: z.uuid().array(),
});

const ArchiveDescendantPathSchema = z.object({
    rootArchiveId: z.uuid(),
    descendantPathList: DescendantPathSchema.array(),
});

export type ArchiveDescendantPath = z.infer<typeof ArchiveDescendantPathSchema>;

export async function getArchiveDescendantPathList(
    rootIdList: string[],
): Promise<ArchiveDescendantPath[]> {
    const { records } = await driver.executeQuery(
        getArchiveDescendantPathListCypher,
        { rootIdList },
        { database: "neo4j" },
    );

    return records.map((record) =>
        ArchiveDescendantPathSchema.parse({
            rootArchiveId: record.get("rootArchiveId"),
            descendantPathList: record.get("descendantPathList"),
        }),
    );
}
