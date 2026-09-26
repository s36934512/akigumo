import path from "node:path";

import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { getFileExtensionId } from "#app/modules/system/file/index.js";
import { FileStatus } from "#generated/prisma/enums.js";

import { convertToWebp } from "./helper.js";

export async function transcode(input: string) {
    const file = await prisma.file.findUnique({
        where: { id: input },
    });

    if (!file?.physicalPath) {
        throw new NonRetryableError(`File not found: ${input}`);
    }

    const processDir = path.dirname(file.physicalPath);
    const result = await convertToWebp(processDir);
    const { extensionId, conceptId } = await getFileExtensionId(
        "webp",
        "image/webp",
    );

    const [_, compressed] = await prisma.$transaction([
        prisma.file.update({
            where: {
                id: input,
            },
            data: {
                status: FileStatus.AVAILABLE,
            },
        }),
        prisma.file.create({
            data: {
                systemName: "compressed.webp",
                physicalPath: Paths.concat(processDir, "compressed.webp"),
                size: result.size,
                checksum: result.checksum,
                isOriginal: false,
                status: FileStatus.AVAILABLE,
                fileExtensionId: extensionId,
                metadata: {
                    width: result.width,
                    height: result.height,
                },
            },
        }),
    ]);

    return {
        fileId: compressed.id,
        conceptId: conceptId,
    };
}
