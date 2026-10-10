import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { ArchiveStatus, ArchiveType } from "#generated/prisma/enums.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildArchiveUncompressTask } from "../factory/archive-uncompress.js";

const InputSchema = z.object({
    fileId: z.uuid(),
    derivedFileIds: z.uuid().array(),
});

export const archiveUncompressTask = defineGraphSyncTask({
    name: "archive-uncompress",
    schema: InputSchema,
    execute: async (input) => {
        const { fileId, derivedFileIds } = input;

        const { item, file, derivedFiles } = await prisma.$transaction(
            async (tx) => {
                const [file, derivedFiles] = await Promise.all([
                    tx.file.findUnique({
                        where: {
                            id: fileId,
                        },
                    }),
                    tx.file.findMany({
                        where: {
                            id: {
                                in: derivedFileIds,
                            },
                        },
                    }),
                ]);

                if (!file || !derivedFiles.length) {
                    throw new NonRetryableError("file not found");
                }

                const item = await tx.archive.create({
                    data: {
                        name: file.originalName ?? "Uncompressed Archive",
                        type: ArchiveType.WORK,
                        status: ArchiveStatus.ACTIVE,
                    },
                });

                return { item, file, derivedFiles };
            },
        );

        const task = buildArchiveUncompressTask({
            fileId: file.id,
            itemId: item.id,
            itemName: Paths.basename(item.name, false),
            childrenFileIds: derivedFiles.map((f) => f.id),
            fileExtensionCode: file.extensionCode,
        });

        return {
            taskType: "ArchiveUncompressExecutor",
            payload: task,
        };
    },
});
