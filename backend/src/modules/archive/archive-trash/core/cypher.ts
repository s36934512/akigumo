export const getArchiveGraphInfoCypher = `
    MATCH (i:Archive)
    WHERE i.id IN $archiveIdList

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(cp:Concept)

    WITH i, f,
        collect(DISTINCT
            CASE
                WHEN cp IS NOT NULL
                THEN {conceptId: cp.id, type: s.type}
            END
        ) AS withConceptList

    OPTIONAL MATCH (i)-[:HAS_CONCEPT]->(c:Concept)

    WITH i, f, withConceptList,
        collect(DISTINCT
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: null}
            END
        ) AS hasConceptList

    OPTIONAL MATCH (i)-[:CONTAINS]->(child:Archive)

    WITH i, f, withConceptList, hasConceptList,
        count(DISTINCT child) AS count

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        count,
        [
            item IN withConceptList + hasConceptList
            WHERE item IS NOT NULL
        ] AS conceptList
`;

export const getChildrenCypher = `
    MATCH (:Archive { id: $parentId })-[r:CONTAINS]->(i:Archive)
    WHERE i.id IN $archiveIdList

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(cp:Concept)

    WITH i, f, r.position AS position,
        collect(DISTINCT
            CASE
                WHEN cp IS NOT NULL
                THEN {conceptId: cp.id, type: s.type}
            END
        ) AS withConceptList

    OPTIONAL MATCH (i)-[:HAS_CONCEPT]->(c:Concept)

    WITH i, f, position, withConceptList,
        collect(DISTINCT
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: null}
            END
        ) AS hasConceptList

    OPTIONAL MATCH (i)-[:CONTAINS]->(child:Archive)

    WITH i, f, position, withConceptList, hasConceptList,
        count(DISTINCT child) AS count

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        count,
        [
            item IN withConceptList + hasConceptList
            WHERE item IS NOT NULL
        ] AS conceptList
    ORDER BY position ASC, archiveId ASC
`;
