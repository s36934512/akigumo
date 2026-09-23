import { prisma } from "#app/infrastructure/database/prisma.js";

export async function updateConceptList(idList: string[]) {
    const updated = await prisma.concept.updateManyAndReturn({
        where: {
            id: { in: idList },
            deletedAt: null,
        },
        data: { deletedAt: new Date() },
    });

    return updated.map((record) => record.id);
}
