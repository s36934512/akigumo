import { z } from "zod";

const InputSchema = z.object({
    fileId: z.uuid(),
    archiveId: z.uuid(),
    fileExtensionCode: z.string().nullish(),
    originalName: z.string().nullish(),
});

const TaskPayloadSchema = InputSchema.transform((data) => ({
    fileId: data.fileId,
    fileProps: {
        originalName: data.originalName ?? null,
        fileType: data.fileExtensionCode ?? null,
    },
    archiveId: data.archiveId,
    archiveProps: {
        name: data.originalName ?? data.fileId,
    },
}));

type InputPayload = z.infer<typeof InputSchema>;

export function buildFileRegistryTask(payload: InputPayload) {
    return TaskPayloadSchema.parse(payload);
}
