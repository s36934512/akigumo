import { z } from "zod";

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

export const ArchiveIntentSchema = createFlexibleSchema(
    z.object({
        notifyId: z.uuid(), // SSE通知頻道
        batchId: z.uuid(), // 批次ID，用於上傳流程workflow的追蹤與管理
        fileList: IntentFileSchema.array,
    }),
);

export type ArchiveIntent = InferFlexible<typeof ArchiveIntentSchema>;

export const IntentRequestSchema = ArchiveIntentSchema.single;

export const IntentResponseSchema = WorkflowResponseSchema;

export const ArchiveSealSchema = createFlexibleSchema(
    z.object({
        notifyId: z.uuid(),
        fileId: z.uuid(),
    }),
);

export type ArchiveSeal = InferFlexible<typeof ArchiveSealSchema>;

export const SealRequestSchema = ArchiveSealSchema.single.extend({
    workflowId: z.uuid(),
});

export const SealResponseSchema = WorkflowResponseSchema;

export const StatusRequestSchema = z.object({
    workflowId: z.uuid(),
});

export const StatusResponseSchema = z.object({
    status: z.string(),
});
