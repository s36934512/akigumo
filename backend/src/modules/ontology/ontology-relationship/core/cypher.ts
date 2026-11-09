export const cypherQuery = `
    MATCH (p:Concept { id: $conceptId })

    CALL (p) {
        OPTIONAL MATCH (p)-[:WITH]->(subjectStatement:Statement)
        WITH collect(DISTINCT subjectStatement) AS subjectStatementList

        OPTIONAL MATCH (keyStatement:Statement)-[:ABOUT_KEY]->(p)
        WITH
            subjectStatementList,
            collect(DISTINCT keyStatement) AS keyStatementList

        OPTIONAL MATCH (valueStatement:Statement)-[:WITH]->(p)
        WITH
            subjectStatementList,
            keyStatementList,
            collect(DISTINCT valueStatement) AS valueStatementList

        WITH
            subjectStatementList
            + keyStatementList
            + valueStatementList AS statementList

        UNWIND statementList AS statement

        WITH DISTINCT statement
        WHERE statement IS NOT NULL

        OPTIONAL MATCH (subject)-[:WITH]->(statement)
        WHERE subject:Concept OR subject:Archive

        WITH
            statement,
            collect(
                DISTINCT CASE
                    WHEN subject IS NULL THEN null
                    ELSE {
                        id: subject.id,
                        entityType: CASE
                            WHEN subject:Concept THEN "CONCEPT"
                            ELSE "ARCHIVE"
                        END
                    }
                END
            ) AS subjectList

        OPTIONAL MATCH (statement)-[:WITH]->(value:Concept)

        WITH
            statement,
            subjectList,
            collect(
                DISTINCT CASE
                    WHEN value IS NULL THEN null
                    ELSE {
                        id: value.id,
                        entityType: "CONCEPT"
                    }
                END
            ) AS valueList

        OPTIONAL MATCH (statement)-[:ABOUT_KEY]->(key:Concept)

        WITH
            statement,
            subjectList,
            valueList,
            collect(DISTINCT key.id) AS keyIdList

        RETURN collect({
            id: elementId(statement),
            type: coalesce(statement.type, ""),
            keyConceptId: head(keyIdList),
            subject: head(subjectList),
            values: valueList
        }) AS statementList
    }

    CALL (p) {
        OPTIONAL MATCH (p)-[r]-(related)
        WHERE related:Concept OR related:Archive

        RETURN collect(
            DISTINCT CASE
                WHEN r IS NULL THEN null
                ELSE {
                    id: elementId(r),
                    type: type(r),

                    source: {
                        id: startNode(r).id,
                        entityType: CASE
                            WHEN "Concept" IN labels(startNode(r))
                                THEN "CONCEPT"
                            ELSE "ARCHIVE"
                        END
                    },

                    target: {
                        id: endNode(r).id,
                        entityType: CASE
                            WHEN "Concept" IN labels(endNode(r))
                                THEN "CONCEPT"
                            ELSE "ARCHIVE"
                        END
                    },

                    properties: properties(r)
                }
            END
        ) AS relationshipList
    }

    CALL (p) {
        OPTIONAL MATCH (p)-[:HAS_CONCEPT]-(archive:Archive)

        RETURN collect(DISTINCT archive.id) AS archiveIdList
    }

    RETURN
        p.id AS conceptId,
        statementList,
        relationshipList,
        archiveIdList
`;
