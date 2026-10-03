import { z } from "zod";

import { createFlexibleSchema, type InferFlexible } from "#app/shared/lib/zod";

export const UppyFileMetaSchema = z
    .object({
        fileId: z.uuid(),
    })
    .catchall(z.unknown());
export type UppyFileMeta = z.infer<typeof UppyFileMetaSchema>;

export const UppyFileResponseSchema = z
    .object({
        data: z.instanceof(File),
    })
    .catchall(z.unknown());
export type UppyFileResponse = z.infer<typeof UppyFileResponseSchema>;

export const ScannedFileSchema = createFlexibleSchema(
    z.object({
        id: z.uuid(),
        name: z.string(),
        size: z.number().int().positive(),
        metadata: z.object({
            path: z.string(),
        }),
    }),
);
export type ScannedFile = InferFlexible<typeof ScannedFileSchema>;
