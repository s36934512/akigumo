import { z } from "@hono/zod-openapi";

import { FileModelSchema } from "#app/generated/zod/schemas/index.js";

const InputSchema = z.object({
    fileId: z.uuid(),
    fileName: z.string().nullish(),
    archiveId: z.uuid(),
    archiveName: z.string().nullish(),
    childrenArchiveList: FileModelSchema.extend({
        position: z.number().int().nonnegative(),
    })
        .array()
        .min(1, "至少包含一個子項目"),
    fileExtensionCode: z.string().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
    fileId: data.fileId,
    fileProps: {
        name: data.fileName ?? null,
        fileType: data.fileExtensionCode ?? null,
    },
    archiveId: data.archiveId,
    archiveProps: {
        name: data.archiveName ?? null,
    },
    childrenArchiveList: data.childrenArchiveList.map((i) => ({
        fileId: i.id,
        fileProps: {
            originalName: i.originalName ?? null,
            fileType: i.extensionCode ?? null,
        },
        archiveId: i.id,
        archiveProps: {
            name: i.originalName ?? i.id,
        },
        position: i.position,
    })),
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildArchiveUncompressTask(payload: InputPayload) {
    return TaskPayloadSchema.parse(payload);
}
