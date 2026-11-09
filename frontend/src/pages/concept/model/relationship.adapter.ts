import type { ElementsDefinition } from "cytoscape";

import type {
    ConceptRelationshipResponse,
    RelationshipEntityReference,
} from "#app/entities/concept";

interface EntityData {
    id: string;
    name?: string;
    title?: string;
}

function getNodeId(
    entityType: RelationshipEntityReference["entityType"],
    id: string,
): string {
    return `${entityType}:${id}`;
}

export function toRelationshipElements(
    response: ConceptRelationshipResponse,
): ElementsDefinition {
    const entityMap = new Map<string, EntityData>();

    for (const concept of response.concepts) {
        const id = concept.id;

        if (typeof id !== "string") continue;

        entityMap.set(getNodeId("CONCEPT", id), concept);
    }

    for (const archive of response.archives) {
        const id = archive.id;

        if (typeof id !== "string") continue;

        entityMap.set(getNodeId("ARCHIVE", id), archive);
    }

    const nodeMap = new Map<string, ElementsDefinition["nodes"][number]>();

    const edgeMap = new Map<string, ElementsDefinition["edges"][number]>();

    function addNode(reference: RelationshipEntityReference) {
        const nodeId = getNodeId(reference.entityType, reference.id);

        if (nodeMap.has(nodeId)) return nodeId;

        const entity = entityMap.get(nodeId);

        const name = entity?.name ?? entity?.title ?? reference.id;

        nodeMap.set(nodeId, {
            data: {
                ...entity,
                id: nodeId,
                entityId: reference.id,
                entityType: reference.entityType,
                name: String(name),
            },
        });

        return nodeId;
    }

    // 1. Statement：Subject → Value
    for (const statement of response.statements) {
        const source = addNode(statement.subject);

        for (const value of statement.values) {
            const target = addNode(value);

            if (source === target) continue;

            const id = `statement:${statement.id}:${target}`;

            edgeMap.set(id, {
                data: {
                    id,
                    source,
                    target,
                    label: statement.type,
                    edgeType: "STATEMENT",
                    statementId: statement.id,
                    keyConceptId: statement.keyConceptId,
                },
            });
        }
    }

    // 2. Direct Relationship：保留原始方向
    for (const relationship of response.relationships) {
        const source = addNode(relationship.source);
        const target = addNode(relationship.target);

        if (source === target) continue;

        const id = `relationship:${relationship.id}`;

        edgeMap.set(id, {
            data: {
                id,
                source,
                target,
                label: relationship.type,
                edgeType: "DIRECT",
                relationshipId: relationship.id,
                properties: relationship.properties,
            },
        });
    }

    return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
    };
}
