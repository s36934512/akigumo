import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";
import { NonRetryableError } from "#app/kernel/index.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildFileRegistryTask } from "../factory/file-registry.js";

const PayloadSchema = z
    .object({
        fileId: z.uuid(),
        archiveId: z.uuid(),
    })
    .array();

type Payload = z.infer<typeof PayloadSchema>;

async function fileRegistryHandler(payload: Payload) {
    const fileIdList = Array.from(new Set(payload.map((item) => item.fileId)));

    const archiveIdList = Array.from(
        new Set(payload.map((item) => item.archiveId)),
    );

    const [fileList, archiveList] = await Promise.all([
        prisma.file.findMany({
            where: {
                id: {
                    in: fileIdList,
                },
            },
        }),

        prisma.archive.findMany({
            where: {
                id: {
                    in: archiveIdList,
                },
            },
        }),
    ]);

    if (fileList.length === 0)
        throw new NonRetryableError("File not found", fileIdList);

    if (archiveList.length === 0)
        throw new NonRetryableError("Archive not found", archiveIdList);

    const fileMap = new Map(fileList.map((item) => [item.id, item]));
    const archiveMap = new Map(archiveList.map((item) => [item.id, item]));

    const validPairList = [];
    const missingPairList = [];

    for (const pair of payload) {
        const file = fileMap.get(pair.fileId);
        const archive = archiveMap.get(pair.archiveId);

        if (!file || !archive) {
            missingPairList.push(pair);
            continue;
        }

        validPairList.push({
            file,
            archive,
        });
    }

    if (missingPairList.length > 0) {
        throw new NonRetryableError(
            "File or Archive not found",
            missingPairList,
        );
    }

    const task = validPairList.map(({ file, archive }) =>
        buildFileRegistryTask({
            fileId: file.id,
            archiveId: archive.id,
            fileExtensionCode: file.extensionCode,
            originalName: file.originalName,
        }),
    );

    return {
        taskType: "FileRegistryExecutor",
        payload: task,
    };
}

export const fileRegistryTask = defineGraphSyncTask({
    name: "file-registry",
    schema: PayloadSchema,
    execute: fileRegistryHandler,
});
