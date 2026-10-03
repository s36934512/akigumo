import { z } from "@hono/zod-openapi";

import { WorkflowResponseSchema } from "#app/api/response.js";
import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

export const IntentFileSchema = createFlexibleSchema(
    z.object({
        id: z.uuid(),
        name: z.string(),
        size: z.int().nonnegative(),
        metadata: z
            .record(z.string(), z.json())
            .optional()
            .openapi({
                type: "object",
                description:
                    "警告，目前 @hono/zod-openapi@1.6.3 不支援 zod@4.6.5 的z.json()，需要自行覆蓋預設才能正常開啟swagger",
                example: {
                    type: "object",
                    description: "任意的 JSON 物件資料",
                },
            }),
    }),
);
export type IntentFile = InferFlexible<typeof IntentFileSchema>;

export const RequestSchema = z.object({
    fileList: IntentFileSchema.array,
});

export const ResponseSchema = WorkflowResponseSchema;

export const ArchiveUploadFinishedSchema = createFlexibleSchema(
    z.object({
        fileId: z.uuid(),
    }),
);

export type ArchiveUploadFinished = InferFlexible<
    typeof ArchiveUploadFinishedSchema
>;
