import { z } from "zod";

import { ResultSchema } from "./result.js";

export const WORKFLOW_RESULT_VERSION = "1.0.0";

/*
 * Processor 發送者資料結構
 *
 * id 對應產生此 Workflow Result 的 Outbox.id。
 * WorkflowEngine 會使用它做 Result idempotency。
 */
const ProcessorSourceSchema = z.object({
    operation: z.string(),
    outboxId: z.coerce.bigint(),
});

/*
 * 工作流程接收資料結構
 */
export const WorkflowResultSchema = z.object({
    version: z.literal(WORKFLOW_RESULT_VERSION),
    workflowId: z.uuid(),
    source: ProcessorSourceSchema,
    result: ResultSchema,
});

export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
