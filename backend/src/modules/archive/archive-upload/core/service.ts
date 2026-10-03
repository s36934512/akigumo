import { prisma } from "#app/infrastructure/database/prisma.js";

import { ARCHIVE_DISPATCH } from "../../archive-integration/core/processor/dispatch.js";

export async function updateFileAndIntegrationRequest({
    fileId,
    originalFilePath,
}: {
    fileId: string;
    originalFilePath: string;
}) {
    await prisma.$transaction([
        prisma.file.update({
            where: { id: fileId },
            data: {
                physicalPath: originalFilePath,
            },
        }),

        prisma.outbox.create({
            data: {
                workflowId: fileId,
                operation: ARCHIVE_DISPATCH,
                payload: {
                    fileId,
                    uncompressMaxDepth: 3,
                },
            },
        }),
    ]);
}
