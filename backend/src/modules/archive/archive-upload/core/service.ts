import { prisma } from "#app/infrastructure/database/prisma.js";
import type {
    ArchiveCreateManyInput,
    FileCreateManyInput,
} from "#generated/prisma/models.js";

import { ARCHIVE_DISPATCH } from "../../archive-integration/core/processor/dispatch.js";

export async function createItemFile({
    fileList,
    itemList,
}: {
    fileList: FileCreateManyInput[];
    itemList: ArchiveCreateManyInput[];
}) {
    await prisma.$transaction([
        prisma.file.createMany({
            data: fileList,
        }),

        prisma.archive.createMany({
            data: itemList,
        }),
    ]);
}

export async function updateFileAndIntegrationRequest({
    fileId,
    fileName,
    originalFilePath,
    notifyId,
}: {
    fileId: string;
    fileName: string;
    originalFilePath: string;
    notifyId: string;
}) {
    await prisma.$transaction([
        prisma.file.update({
            where: { id: fileId },
            data: {
                physicalPath: originalFilePath,
                originalName: fileName,
            },
        }),

        prisma.outbox.create({
            data: {
                workflowId: fileId,
                operation: ARCHIVE_DISPATCH,
                payload: {
                    fileId,
                    uncompressMaxDepth: 3,
                    notifyId,
                },
            },
        }),
    ]);
}
