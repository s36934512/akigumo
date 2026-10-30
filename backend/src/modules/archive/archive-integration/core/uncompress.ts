import path from "node:path";
import { z } from "@hono/zod-openapi";
import fs from "fs-extra";
import pLimit from "p-limit";

import {
    ArchiveStatusSchema,
    ArchiveTypeSchema,
} from "#app/generated/zod/schemas/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { enqueueBatch } from "#app/infrastructure/search-sync/repository/search-sync-outbox-repository.js";
import { extractArchiveWithPython } from "#app/infrastructure/storage/archive/extract.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import type { FileCreateInput } from "#generated/prisma/models.js";

const CONCURRENCY_LIMIT = 20;

export const ArchiveCreateInputSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    type: ArchiveTypeSchema,
    status: ArchiveStatusSchema,
});

export type ArchiveCreateInput = z.infer<typeof ArchiveCreateInputSchema>;

export async function createExtractedFiles({
    fileList,
    archiveList,
}: {
    fileList: FileCreateInput[];
    archiveList: ArchiveCreateInput[];
}) {
    await prisma.$transaction(async (tx) => {
        await tx.file.createMany({
            data: fileList,
        });

        await tx.archive.createMany({
            data: archiveList,
        });

        await enqueueBatch(
            tx,
            archiveList.map((archive) => ({
                entityType: "ARCHIVE",
                entityId: archive.id,
                operation: "UPSERT",
            })),
        );
    });
}

async function listFilesRecursively(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await listFilesRecursively(fullPath)));
            continue;
        }
        if (entry.isFile()) {
            results.push(fullPath);
        }
    }

    return results;
}

export async function extractArchive(fileId: string) {
    const file = await prisma.file.findUnique({
        where: {
            id: fileId,
        },
        select: {
            physicalPath: true,
            extensionCode: true,
        },
    });

    if (!file?.physicalPath) {
        throw new NonRetryableError(`File not found: ${fileId}`);
    }

    if (!file.extensionCode) {
        throw new NonRetryableError(`File extension Code not found: ${fileId}`);
    }

    const processDir = path.dirname(file.physicalPath);
    const outputDir = Paths.concat(processDir, "extracted");

    const archivePath = Paths.concat(
        processDir,
        `archive.${file.extensionCode}`,
    );
    await fs.copy(file.physicalPath, archivePath, { overwrite: true });

    try {
        await extractArchiveWithPython({ archivePath, outputDir });
    } catch (error) {
        throw new NonRetryableError(
            error instanceof Error ? error.message : String(error),
        );
    } finally {
        await fs.remove(archivePath);
    }

    const extractedFileList = await listFilesRecursively(outputDir);

    return { processDir, extractedFileList };
}

const MassiveInputSchema = z
    .object({
        sourcePath: z.string(),
        targetPath: z.string(),
    })
    .array();

type MassiveInput = z.infer<typeof MassiveInputSchema>;

export async function moveMassiveFiles(files: MassiveInput) {
    try {
        const limit = pLimit(CONCURRENCY_LIMIT);
        const moveTasks = files.map((file) => {
            // 使用 limit 包裹非同步的 move 操作
            return limit(async () => {
                try {
                    await fs.move(file.sourcePath, file.targetPath, {
                        overwrite: true,
                    });
                } catch (error) {
                    logger.error(
                        {
                            err: error,
                            sourcePath: file.sourcePath,
                            targetPath: file.targetPath,
                        },
                        "Failed to move file",
                    );
                }
            });
        });

        await Promise.all(moveTasks);
    } catch (error) {
        logger.error({ err: error }, "Massive file move operation failed");
    }
}
