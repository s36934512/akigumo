import { z } from "zod";
import { ErrorDetailSchema } from "./error.js";

const GRAPH_REFINEMENT_REQUEST_VERSION = "1.0.0";
const GRAPH_OPERATION_RESULT_VERSION = "1.0.0";

export const GraphOperationSuccessResultsSchema = z.object({
    status: z.literal("SUCCESS"),
    execution: z.object({
        records: z.record(z.string(), z.unknown()).array(),
    }),
});

export const GraphOperationFailureResultsSchema = z.object({
    status: z.literal("FAILURE"),
    error: ErrorDetailSchema,
});

export const GraphOperationResultPayloadSchema = z.discriminatedUnion(
    "status",
    [GraphOperationSuccessResultsSchema, GraphOperationFailureResultsSchema],
);

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

export const GraphOperationResultSchema = z
    .object({
        version: z.literal(GRAPH_OPERATION_RESULT_VERSION),
        workflowId: z.uuid(),
        intentOutboxId: z.coerce.bigint(),
    })
    .and(GraphOperationResultPayloadSchema);

export type GraphOperationResult = z.infer<typeof GraphOperationResultSchema>;
