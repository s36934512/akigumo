from graph_refinement.executors.base import GenericNodeBase


class FileRegistryExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["fileId", "archiveId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request

        UNWIND request.payload AS data

        {self._merge_file}
        {self._merge_file_container}

        MERGE (i)-[:CONTAINS]->(f)

        WITH request, f, i
        OPTIONAL MATCH (i)-[r:DISPLAY_AS]->(n)

        WITH request, f, i, r, n
        ORDER BY n.createdAt DESC

        WITH request, f, i,
            head(collect(n)) AS oldNode,
            collect(r) AS oldRelationships

        FOREACH (r IN oldRelationships |
            DELETE r
        )

        MERGE (i)-[:DISPLAY_AS]->(f)

        FOREACH (n IN CASE WHEN oldNode IS NULL THEN [] ELSE [oldNode] END |
            MERGE (n)-[:NEXT]->(f)
        )

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """
