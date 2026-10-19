export const getChildrenCypher = `
    MATCH (:Archive { id: $parentId })-[:CONTAINS]->(i:Archive)
    WHERE $showDeleted = true OR NOT i:Delete

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(cp:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT cp:Delete)

    WITH i, f,
        collect(DISTINCT
            CASE
                WHEN cp IS NOT NULL
                THEN {conceptId: cp.id, type: s.type}
            END
        ) AS withConceptList

    OPTIONAL MATCH (i)-[:HAS_CONCEPT]->(c:Concept)
    WHERE $showDeleted = true OR NOT c:Delete

    WITH i, f, withConceptList,
        collect(DISTINCT
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: null}
            END
        ) AS hasConceptList

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        [
            item IN withConceptList + hasConceptList
            WHERE item IS NOT NULL
        ] AS conceptList
`;

export const getRootArchiveListCypher = `
    MATCH (i:Archive)
    WHERE NOT (()-[:CONTAINS]->(i))
        AND ($showDeleted = true OR NOT i:Delete)

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(cp:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT cp:Delete)

    WITH i, f,
        collect(DISTINCT
            CASE
                WHEN cp IS NOT NULL
                THEN {conceptId: cp.id, type: s.type}
            END
        ) AS withConceptList

    OPTIONAL MATCH (i)-[:HAS_CONCEPT]->(c:Concept)
    WHERE $showDeleted = true OR NOT c:Delete

    WITH i, f, withConceptList,
        collect(DISTINCT
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: null}
            END
        ) AS hasConceptList

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        [
            item IN withConceptList + hasConceptList
            WHERE item IS NOT NULL
        ] AS conceptList
`;
