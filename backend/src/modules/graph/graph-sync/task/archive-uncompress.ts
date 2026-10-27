import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { ArchiveStatus, ArchiveType } from "#generated/prisma/enums.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildArchiveUncompressTask } from "../factory/archive-uncompress.js";

const InputSchema = z.object({
    fileId: z.uuid(),
    derivedFileIdList: z.uuid().array(),
});

export const archiveUncompressTask = defineGraphSyncTask({
    name: "archive-uncompress",
    schema: InputSchema,
    execute: async (input) => {
        const { fileId, derivedFileIdList } = input;

        const { archive, file, derivedFileList } = await prisma.$transaction(
            async (tx) => {
                const [file, derivedFileList] = await Promise.all([
                    tx.file.findUnique({
                        where: {
                            id: fileId,
                        },
                    }),
                    tx.file.findMany({
                        where: {
                            id: {
                                in: derivedFileIdList,
                            },
                        },
                    }),
                ]);

                if (!file || !derivedFileList.length) {
                    throw new NonRetryableError("file not found");
                }

                const archive = await tx.archive.create({
                    data: {
                        name: Paths.basename(
                            file.originalName ?? "Uncompressed Archive",
                            false,
                        ),
                        type: ArchiveType.WORK,
                        status: ArchiveStatus.ACTIVE,
                    },
                });

                return { archive, file, derivedFileList };
            },
        );

        const task = buildArchiveUncompressTask({
            fileId: file.id,
            fileName: file.originalName,
            archiveId: archive.id,
            archiveName: archive.name,
            childrenArchiveList: derivedFileList,
            fileExtensionCode: file.extensionCode,
        });

        return {
            taskType: "ArchiveUncompressExecutor",
            payload: [task],
        };
    },
});
