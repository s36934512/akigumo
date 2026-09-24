import { z } from "zod";

import { ResultSchema } from "./result.js";

const GRAPH_REFINEMENT_REQUEST_VERSION = "1.0.0";
const GRAPH_OPERATION_RESULT_VERSION = "1.0.0";

export const GraphRefinementRequestSchema = z.object({
    version: z.literal(GRAPH_REFINEMENT_REQUEST_VERSION),
    workflowId: z.uuid(),
    intentOutboxId: z.coerce.bigint(),
    operation: z.string(),
    payload: z.unknown(),
});

export type GraphRefinementRequest = z.infer<
    typeof GraphRefinementRequestSchema
>;

export const GraphOperationResultSchema = z.object({
    version: z.literal(GRAPH_OPERATION_RESULT_VERSION),
    workflowId: z.uuid(),
    intentOutboxId: z.coerce.bigint(),
    result: ResultSchema,
});

export type GraphOperationResult = z.infer<typeof GraphOperationResultSchema>;
