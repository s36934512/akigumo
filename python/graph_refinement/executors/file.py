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

        MERGE (af)-[:CONTAINS]->(f)

        WITH request, f, af
        OPTIONAL MATCH (af)-[r:DISPLAY_AS]->(n)

        WITH request, f, af, r, n
        ORDER BY n.createdAt DESC

        WITH request, f, af,
            head(collect(n)) AS oldNode,
            collect(r) AS oldRelationships

        FOREACH (r IN oldRelationships |
            DELETE r
        )

        MERGE (af)-[:DISPLAY_AS]->(f)

        FOREACH (n IN CASE WHEN oldNode IS NULL THEN [] ELSE [oldNode] END |
            MERGE (n)-[:NEXT]->(f)
        )

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """
