from graph_refinement.core.executor import BaseExecutor


class GenericNodeBase(BaseExecutor):
    """Shared Neo4j Cypher fragments for graph refinement executors."""

    @property
    def _merge_file(self):
        return """
        MERGE (f:File {id: data.fileId})
        ON CREATE SET f.createdAt = datetime()
        ON MATCH SET f.updatedAt = datetime()
        SET f += data.fileProps
        """

    @property
    def _merge_file_container(self) -> str:
        return """
        MERGE (af:Archive:FileContainer {id: data.archiveId})
        ON CREATE SET af.createdAt = datetime()
        ON MATCH SET af.updatedAt = datetime()
        SET af += data.archiveProps
        """

    @property
    def _merge_work(self) -> str:
        return """
        MERGE (aw:Archive:Work {id: data.archiveId})
        ON CREATE SET aw.createdAt = datetime()
        ON MATCH SET aw.updatedAt = datetime()
        SET aw += data.archiveProps
        """

    @property
    def _merge_concept(self) -> str:
        return """
        MERGE (c:Concept {id: data.conceptId})
        ON CREATE SET c.createdAt = datetime()
        ON MATCH SET c.updatedAt = datetime()
        SET c += data.conceptProps
        """

    @property
    def _merge_user(self) -> str:
        return """
        MERGE (u:User {id: data.userId})
        ON CREATE SET u.createdAt = datetime()
        ON MATCH SET u.updatedAt = datetime()
        SET u += data.userProps
        """
