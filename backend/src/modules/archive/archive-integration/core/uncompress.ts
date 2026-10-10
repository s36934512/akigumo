import path from "node:path";
import { z } from "@hono/zod-openapi";
import fs from "fs-extra";
import pLimit from "p-limit";

import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { extractArchiveWithPython } from "#app/infrastructure/storage/archive/extract.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import type {
    ArchiveCreateInput,
    FileCreateInput,
} from "#generated/prisma/models.js";

const CONCURRENCY_LIMIT = 20;

export async function createExtractedFiles({
    fileList,
    itemList,
}: {
    fileList: FileCreateInput[];
    itemList: ArchiveCreateInput[];
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

    return await listFilesRecursively(outputDir);
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
