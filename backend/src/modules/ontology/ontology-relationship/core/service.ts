import { z } from "zod";

import { driver } from "#app/infrastructure/database/neo4j.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import type { QueryInput } from "../api/schema.js";
import { cypherQuery } from "./cypher.js";

const EntityReferenceSchema = z.object({
    id: z.string(),
    entityType: z.enum(["CONCEPT", "ARCHIVE"]),
});

const RecordSchema = z.object({
    conceptId: z.string(),

    statementList: z.array(
        z.object({
            id: z.string(),
            type: z.string(),
            keyConceptId: z.string().nullable(),
            subject: EntityReferenceSchema,
            values: EntityReferenceSchema.array(),
        }),
    ),

    relationshipList: z.array(
        z.object({
            id: z.string(),
            type: z.string(),
            source: EntityReferenceSchema,
            target: EntityReferenceSchema,
            properties: z.record(z.string(), z.unknown()),
        }),
    ),

    archiveIdList: z.string().array(),
});

export async function getConceptStructure(input: QueryInput) {
    const { conceptId } = input;

    const { records: recordList } = await driver.executeQuery(
        cypherQuery,
        { conceptId },
        { database: "neo4j" },
    );

    if (recordList.length === 0) {
        return {
            conceptId,
            statementList: [],
            relationshipList: [],
            archiveIdList: [],
        };
    }

    const record = RecordSchema.parse({
        conceptId: recordList[0].get("conceptId"),
        statementList: recordList[0].get("statementList"),
        relationshipList: recordList[0].get("relationshipList"),
        archiveIdList: recordList[0].get("archiveIdList"),
    });

    return record;
}

export async function findEntities(
    structure: Awaited<ReturnType<typeof getConceptStructure>>,
) {
    const conceptIdSet = new Set<string>([structure.conceptId]);
    const archiveIdSet = new Set<string>(structure.archiveIdList);

    function collectEntity(reference: {
        id: string;
        entityType: "CONCEPT" | "ARCHIVE";
    }) {
        if (reference.entityType === "CONCEPT") {
            conceptIdSet.add(reference.id);
        } else {
            archiveIdSet.add(reference.id);
        }
    }

    for (const statement of structure.statementList) {
        collectEntity(statement.subject);

        for (const value of statement.values) {
            collectEntity(value);
        }

        if (statement.keyConceptId) {
            conceptIdSet.add(statement.keyConceptId);
        }
    }

    for (const relationship of structure.relationshipList) {
        collectEntity(relationship.source);
        collectEntity(relationship.target);
    }

    const [concepts, archives] = await Promise.all([
        prisma.concept.findMany({
            where: {
                id: {
                    in: Array.from(conceptIdSet),
                },
            },
        }),

        prisma.archive.findMany({
            where: {
                id: {
                    in: Array.from(archiveIdSet),
                },
            },
        }),
    ]);

    return {
        concepts,
        archives,
    };
}
