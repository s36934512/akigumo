import { z } from "zod";

export const WorkflowResponseSchema = z.object({
    workflowId: z.uuid(),
});

export const ErrorResponseSchema = z.object({
    error: z.string(),
});
