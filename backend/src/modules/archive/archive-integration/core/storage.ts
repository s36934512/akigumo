import { Prisma } from "#app/generated/prisma/client.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

export async function updateFilePath(
    targetIdList: string[],
    oldSegment: string,
    newSegment: string,
) {
    await prisma.$queryRaw`
            UPDATE "file"
            SET "physical_path" = REPLACE("physical_path", ${oldSegment}, ${newSegment})
            WHERE "id" IN (${Prisma.join(targetIdList)})
                AND "physical_path" LIKE ${`%${oldSegment}%`};
        `;
}
