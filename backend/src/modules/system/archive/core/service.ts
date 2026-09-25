import { z } from "zod";

import { cacheService } from "#app/infrastructure/cache/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

const FILE_META_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const FileMetaSchema = createFlexibleSchema(
    z.object({
        physicalPath: z.string().nullable(),
        systemName: z.string().nullable(),
        mimeType: z.string(),
    }),
);
type FileMeta = InferFlexible<typeof FileMetaSchema>;

export async function getFileMetadata(fileId: string) {
    const metadata = await cacheService.getOrSet<FileMeta["single"]>(
        {
            module: "File",
            key: fileId,
            ttl: FILE_META_CACHE_TTL,
        },
        async () => {
            const file = await prisma.file.findUnique({
                where: { id: fileId },
                select: {
                    physicalPath: true,
                    systemName: true,
                    fileExtension: { select: { mimeType: true } },
                },
            });

            if (!file) throw new Error(`file_not_found:${fileId}`);

            return {
                physicalPath: file.physicalPath,
                systemName: file.systemName,
                mimeType:
                    file.fileExtension?.mimeType ?? "application/octet-stream",
            };
        },
    );

    return metadata;
}
