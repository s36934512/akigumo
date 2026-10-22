export const query = `
    MATCH (a:Archive { id: $id })
    WHERE NOT a:Delete

    OPTIONAL MATCH (a)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (a)-[:WITH]->(s)-[:WITH]->(cp:Concept)
    WHERE NOT s:Delete AND NOT cp:Delete

    WITH a, f,
        collect(DISTINCT
            CASE
                WHEN cp IS NOT NULL
                THEN {conceptId: cp.id, type: s.type}
            END
        ) AS withConceptList

    OPTIONAL MATCH (a)-[:HAS_CONCEPT]->(c:Concept)
    WHERE NOT c:Delete

    WITH a, f, withConceptList,
        collect(DISTINCT
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: null}
            END
        ) AS hasConceptList

    RETURN
        a.id AS archiveId,
        f.id AS currentFileId,
        [
            item IN withConceptList + hasConceptList
            WHERE item IS NOT NULL
        ] AS conceptList
`;
