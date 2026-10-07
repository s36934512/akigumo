import { prisma } from "#app/infrastructure/database/prisma.js";

export async function updateFileAndIntegrationRequest({
    fileId,
    originalFilePath,
}: {
    fileId: string;
    originalFilePath: string;
}) {
    prisma.file.update({
        where: { id: fileId },
        data: {
            physicalPath: originalFilePath,
        },
    });
}
