import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildFileRegistryTask } from "../factory/file-registry.js";

export const PayloadSchema = z
    .object({
        fileId: z.uuid(),
        itemId: z.uuid(),
    })
    .array();

export type FileRegistryPayload = z.infer<typeof PayloadSchema>;

async function fileRegistryHandler(payload: FileRegistryPayload) {
    const fileIds = payload.map((item) => item.fileId);
    const itemIds = payload.map((item) => item.itemId);

    const [files, items] = await Promise.all([
        prisma.file.findMany({
            where: { id: { in: fileIds } },
            include: { fileExtension: true },
        }),
        prisma.archive.findMany({
            where: { id: { in: itemIds } },
        }),
    ]);
    if (files.length === 0) throw new Error("File not found");
    if (items.length === 0) throw new Error("Item not found");

    const fileMap = new Map(files.map((f) => [f.id, f]));
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const task = payload.map((pair) => {
        const file = fileMap.get(pair.fileId);
        const item = itemMap.get(pair.itemId);

        // 確保這一組的 file 和 item 都有撈到資料
        if (!file || !item) {
            throw new Error(
                `Missing file or item relation for fileId: ${pair.fileId}, itemId: ${pair.itemId}`,
            );
        }

        return buildFileRegistryTask({
            fileId: file.id,
            itemId: item.id,
            fileExtensionCode: file.fileExtension.code,
            originalName: file.originalName,
            storageStatus: "on_disk",
        });
    });

    return {
        taskType: "FileExecutor",
        payload: task,
    };
}

export const fileRegistryTask = defineGraphSyncTask({
    name: "file-registry",
    schema: PayloadSchema,
    execute: fileRegistryHandler,
});
