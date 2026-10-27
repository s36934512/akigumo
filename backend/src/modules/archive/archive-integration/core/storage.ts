import path from "path";
import { Prisma } from "#app/generated/prisma/client.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";

export async function getFilePath(fileId: string) {
    const file = await prisma.file.findUnique({
        where: {
            id: fileId,
        },
        select: {
            physicalPath: true,
        },
    });

    if (!file?.physicalPath) {
        throw new NonRetryableError("file 遺失");
    }

    const processDir = path.dirname(file.physicalPath);
    if (processDir.startsWith(Paths.TMP_PROCESS)) {
        const finalDir = processDir.replace(
            Paths.TMP_PROCESS,
            Paths.STORAGE_ORIGINALS,
        );

        return { processDir, finalDir };
    }

    return { processDir, finalDir: null };
}

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
