import type { Concept } from "#app/generated/prisma/client.js";

export type ConceptSearchDocument = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ConceptSearchSource = Pick<
    Concept,
    "id" | "name" | "description" | "createdAt" | "updatedAt"
>;

export function toConceptSearchDocument(
    Concept: ConceptSearchSource,
): ConceptSearchDocument {
    return {
        id: Concept.id,
        name: Concept.name,
        description: Concept.description,
        createdAt: Concept.createdAt.toISOString(),
        updatedAt: Concept.updatedAt.toISOString(),
    };
}
