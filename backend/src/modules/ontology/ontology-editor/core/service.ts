import { prisma } from "#app/infrastructure/database/prisma.js";

import type { OntologyEditor } from "../api/schema.js";

export async function updateConceptList(input: OntologyEditor["single"]) {
    const conceptList = input.registryList;

    const updated = await prisma.$transaction(
        conceptList.map((concept) =>
            prisma.concept.update({
                where: { id: concept.id },
                data: {
                    name: concept.registry.name,
                    description: concept.registry.description,
                    metadata: concept.registry.metadata,
                },
            }),
        ),
    );

    return updated.map((r) => r.id);
}
