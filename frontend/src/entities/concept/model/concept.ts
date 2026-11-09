import type {
    PostApiV1OntologyRelationship200,
    PostApiV1OntologyResolver200EdgesItemData,
    PostApiV1OntologyResolver200NodesItemData,
} from "#app/shared/api/model";

export type Concept = PostApiV1OntologyResolver200NodesItemData;

export type ConceptEdge = PostApiV1OntologyResolver200EdgesItemData;

export type RelationshipEntityType = "CONCEPT" | "ARCHIVE";

export interface RelationshipEntityReference {
    id: string;
    entityType: RelationshipEntityType;
}

export interface ConceptStatement {
    id: string;
    type: string;
    keyConceptId: string | null;
    subject: RelationshipEntityReference;
    values: RelationshipEntityReference[];
}

export interface DirectRelationship {
    id: string;
    type: string;
    source: RelationshipEntityReference;
    target: RelationshipEntityReference;
    properties: Record<string, unknown>;
}

export interface RelationshipEntity {
    id: string;
    name?: string;
    title?: string;
    [key: string]: unknown;
}

export interface ConceptRelationshipResponse {
    concepts: RelationshipEntity[];
    archives: RelationshipEntity[];
    statements: ConceptStatement[];
    relationships: DirectRelationship[];
}
