from typing import ClassVar

from graph_refinement.executors.base import GenericNodeBase


class ConceptRegistryExecutor(GenericNodeBase):
    REQUIRED_IDENTITY: ClassVar[tuple[str, ...]] = ("conceptId",)

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request

        UNWIND request.payload AS data
        {self._merge_concept}

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """


class ConceptDeleteExecutor(GenericNodeBase):
    REQUIRED_IDENTITY: ClassVar[tuple[str, ...]] = ("conceptId",)

    @property
    def template(self) -> str:
        return """
        UNWIND $requests AS request

        UNWIND request.payload AS data
        MATCH (c:Concept {id: data.conceptId})
        SET c:Delete

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """


class ConceptAssociationExecutor(GenericNodeBase):
    REQUIRED_IDENTITY: ClassVar[tuple[str, ...]] = ("conceptPool", "taskList")

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request
        UNWIND request.payload AS group

        FOREACH (data IN coalesce(group.conceptPool, []) |
            {self._merge_concept}
        )

        WITH request, group

        UNWIND coalesce(group.taskList, []) AS association

        MATCH (n)
        WHERE (n:Archive OR n:Concept)
            AND n.id = association.targetId

        UNWIND coalesce(association.conceptIdList, []) AS conceptId
        
        MATCH (c:Concept {{id: conceptId}})
        MERGE (n)-[:HAS_CONCEPT]->(c)

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """


class ConceptAssociationRemoveExecutor(GenericNodeBase):
    REQUIRED_IDENTITY: ClassVar[tuple[str, ...]] = ("targetId", "conceptIdList")

    @property
    def template(self) -> str:
        return """
        UNWIND $requests AS request

        UNWIND request.payload AS data
        MATCH (a:Archive {id: data.targetId})

        UNWIND data.conceptIdList as conceptId
        MATCH (c:Concept {id: conceptId})
        
        MATCH (a)-[r:HAS_CONCEPT]->(c)
        DELETE r

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """
