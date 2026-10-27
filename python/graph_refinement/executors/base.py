from graph_refinement.core.executor import BaseExecutor


class GenericNodeBase(BaseExecutor):
    """Shared Neo4j Cypher fragments for graph refinement executors."""

    def _merge_file(self, var_name: str = "data") -> str:
        return f"""
        MERGE (f:File {{id: {var_name}.fileId}})
        ON CREATE SET f.createdAt = datetime()
        ON MATCH SET f.updatedAt = datetime()
        SET f += {var_name}.fileProps
        """

    def _merge_file_container(self, var_name: str = "data") -> str:
        return f"""
        MERGE (af:Archive:FileContainer {{id: {var_name}.archiveId}})
        ON CREATE SET af.createdAt = datetime()
        ON MATCH SET af.updatedAt = datetime()
        SET af += {var_name}.archiveProps
        """

    def _merge_work(self, var_name: str = "data") -> str:
        return f"""
        MERGE (aw:Archive:Work {{id: {var_name}.archiveId}})
        ON CREATE SET aw.createdAt = datetime()
        ON MATCH SET aw.updatedAt = datetime()
        SET aw += {var_name}.archiveProps
        """

    def _merge_concept(self, var_name: str = "data") -> str:
        return f"""
        MERGE (c:Concept {{id: {var_name}.conceptId}})
        ON CREATE SET c.createdAt = datetime()
        ON MATCH SET c.updatedAt = datetime()
        SET c += {var_name}.conceptProps
        """

    def _merge_user(self, var_name: str = "data") -> str:
        return f"""
        MERGE (u:User {{id: {var_name}.userId}})
        ON CREATE SET u.createdAt = datetime()
        ON MATCH SET u.updatedAt = datetime()
        SET u += {var_name}.userProps
        """
