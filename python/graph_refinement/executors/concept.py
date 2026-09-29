from graph_refinement.executors.base import GenericNodeBase


class ConceptRegistryExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["conceptId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request

        UNWIND request.payload AS data
        {self._merge_concept}

        RETURN DISTINCT request._intentOutboxId AS intentOutboxId
        """


class ConceptDeleteExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["conceptId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $requests AS request

        UNWIND request.payload AS data
        MATCH (c:Concept {{id: data.conceptId}})
        SET c:Delete

        RETURN DISTINCT request._intentOutboxId AS intentOutboxId
        """


class ConceptAttacherExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = []

    @property
    def template(self) -> str:
        return f"""
            UNWIND $batch AS group

            CALL (group) {{
                UNWIND coalesce(group.itemList, []) AS data
                
                {self._merge_item}

                FOREACH (targetId IN coalesce(data.directIds, []) |
                    MERGE (ic:Concept {{id: targetId}})
                    MERGE (i)-[:WITH]->(ic)
                )

                FOREACH (statement IN coalesce(data.connectList, []) |
                    CREATE (s:Statement {{type: statement.key}})
                    SET s.createdTime = datetime()
                    
                    FOREACH (targetConceptId IN coalesce(statement.value, []) |
                        MERGE (sc:Concept {{id: targetConceptId}})
                        MERGE (i)-[:WITH]->(s)-[:WITH]->(sc)
                    )
                )
                }}

            CALL (group) {{
                UNWIND coalesce(group.conceptList, []) AS data

                {self._merge_concept}

                FOREACH (targetId IN coalesce(data.directIds, []) |
                    MERGE (ec:Concept {{id: targetId}})
                    MERGE (e)-[:WITH]->(ec)
                )

                FOREACH (statement IN coalesce(data.connectList, []) |
                    CREATE (s:Statement {{type: statement.key}})
                    SET s.createdTime = datetime()
                    
                    FOREACH (targetConceptId IN coalesce(statement.value, []) |
                        MERGE (sc:Concept {{id: targetConceptId}})
                        MERGE (e)-[:WITH]->(s)-[:WITH]->(sc)
                    )
                )
                }}
            """
