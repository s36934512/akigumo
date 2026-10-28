from graph_refinement.executors.base import GenericNodeBase


class ArchiveUncompressExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ("fileId", "archiveId", "childrenArchiveList")

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request
       
        UNWIND request.payload AS data

        MATCH (i:Archive:FileContainer {{id: data.fileId}})
        {self._merge_work("data")}
        MERGE (aw)-[:SOURCE_OF]->(i)

        CALL (request, data, aw) {{
            UNWIND coalesce(data.childrenArchiveList, []) AS group

            {self._merge_file_container("group")}
            {self._merge_file("group")}
            MERGE (af)-[:CONTAINS]->(f)
            MERGE (aw)-[r:CONTAINS]->(af)
            ON CREATE SET r.position = group.position

            RETURN count(*) AS childCount
        }}

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """


class ArchiveDeleteExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ("archiveId",)

    @property
    def template(self) -> str:
        return """
        UNWIND $requests AS request

        UNWIND request.payload AS data

        MATCH (i:Archive {id: data.archiveId})
        SET i:Delete

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """
