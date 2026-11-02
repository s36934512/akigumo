export const getArchiveDescendantPathListCypher = `
    UNWIND $rootIdList AS rootId
    WITH DISTINCT rootId

    MATCH (root:Archive { id: rootId })

    OPTIONAL MATCH path = (root)-[:CONTAINS*1..]->(descendant:Archive)
    WHERE ALL(
        node IN nodes(path)
        WHERE node:Archive
    )

    WITH
        root,
        collect(
            DISTINCT CASE
                WHEN descendant IS NOT NULL
                THEN {
                    archiveId: descendant.id,
                    pathArchiveIdList: [
                        node IN nodes(path) | node.id
                    ]
                }
            END
        ) AS descendantPathList

    RETURN
        root.id AS rootArchiveId,
        descendantPathList
`;
