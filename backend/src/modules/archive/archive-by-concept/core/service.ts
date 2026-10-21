import { z } from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";

import { query } from "./cypher.js";

export async function getArchiveByConcept(conceptId: string) {
    const { records } = await driver.executeQuery(
        query,
        { conceptId },
        { database: "neo4j" },
    );

    const archiveList = records.map((r) => ({
        archiveList: z.uuid().array().parse(r.get("archiveList")),
    }));

    return archiveList.flatMap(({ archiveList }) => {
        return archiveList;
    });
}
