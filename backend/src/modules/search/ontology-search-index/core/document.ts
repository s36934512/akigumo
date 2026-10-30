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
    concept: ConceptSearchSource,
): ConceptSearchDocument {
    return {
        id: concept.id,
        name: concept.name,
        description: concept.description,
        createdAt: concept.createdAt.toISOString(),
        updatedAt: concept.updatedAt.toISOString(),
    };
}
