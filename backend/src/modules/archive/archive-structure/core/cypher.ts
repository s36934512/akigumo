export const getChildrenCypher = `
    MATCH (:Archive { id: $parentId })-[:CONTAINS]->(i:Archive)
    WHERE $showDeleted = true OR NOT i:Delete

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(c:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT c:Delete)

    WITH i, f,
        collect(
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: s.type}
            END
        ) AS conceptList

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        [item IN conceptList WHERE item IS NOT NULL] AS conceptList
    `;

export const getRootArchiveListCypher = `
    MATCH (i:Archive)
    WHERE NOT (()-[:CONTAINS]->(i))
        AND ($showDeleted = true OR NOT i:Delete)

    OPTIONAL MATCH (i)-[:DISPLAY_AS]->(f:File)

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(c:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT c:Delete)

    WITH i, f,
        collect(
            CASE
                WHEN c IS NOT NULL
                THEN {conceptId: c.id, type: s.type}
            END
        ) AS conceptList

    RETURN
        i.id AS archiveId,
        f.id AS currentFileId,
        [item IN conceptList WHERE item IS NOT NULL] AS conceptList
    `;
