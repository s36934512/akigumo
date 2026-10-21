export const query = `
    MATCH (c:Concept { id: $conceptId })

    OPTIONAL MATCH (a1:Archive)-[:WITH]->(s1)-[:WITH]->(c)
    WHERE NOT a1:Delete AND NOT s1:Delete

    WITH c, collect(DISTINCT a1.id) AS withArchiveList

    OPTIONAL MATCH (a2:Archive)-[:WITH]->(s2)-[:ABOUT_KEY]->(c)
    WHERE NOT a2:Delete AND NOT s2:Delete

    WITH c, withArchiveList,
        collect(DISTINCT a2.id) AS keyArchiveList

    OPTIONAL MATCH (a3:Archive)-[:HAS_CONCEPT]->(c)
    WHERE NOT a3:Delete

    WITH withArchiveList, keyArchiveList,
        collect(DISTINCT a3.id) AS hasConceptList

    RETURN [
        id IN withArchiveList + keyArchiveList + hasConceptList
        WHERE id IS NOT NULL
    ] AS archiveList
`;
