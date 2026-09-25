import { prisma } from "#app/infrastructure/database/prisma.js";

export async function updateArchiveList(idList: string[]) {
    const updated = await prisma.archive.updateManyAndReturn({
        where: {
            id: { in: idList },
            deletedAt: null,
        },
        data: { deletedAt: new Date() },
    });
    return updated.map((r) => r.id);
}
