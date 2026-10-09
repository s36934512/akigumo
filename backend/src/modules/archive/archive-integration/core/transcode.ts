import path from "node:path";

import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";

import { convertToWebp } from "./helper.js";

export async function transcode(fileId: string) {
    const file = await prisma.file.findUnique({
        where: {
            id: fileId,
        },
    });

    if (!file?.physicalPath) {
        throw new NonRetryableError(`File not found: ${fileId}`);
    }

    const processDir = path.dirname(file.physicalPath);
    const result = await convertToWebp(processDir);

    const compressed = await prisma.file.create({
        data: {
            systemName: "compressed.webp",
            physicalPath: Paths.concat(processDir, "compressed.webp"),
            size: result.size,
            checksum: result.checksum,
            isOriginal: false,
            extensionCode: "webp",
            metadata: {
                width: result.width,
                height: result.height,
            },
        },
    });

    return {
        fileId: compressed.id,
    };
}
