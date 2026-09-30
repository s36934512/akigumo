import { z } from "zod";
import { ErrorDetailSchema } from "./error.js";

export const RESULT_STATUS = {
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
} as const;

const SuccessResultSchema = z.object({
    status: z.literal(RESULT_STATUS.SUCCESS),
    data: z.unknown().optional(),
});

const FailureResultSchema = z.object({
    status: z.literal(RESULT_STATUS.FAILURE),
    error: ErrorDetailSchema,
});

export const ResultSchema = z.discriminatedUnion("status", [
    SuccessResultSchema,
    FailureResultSchema,
]);

export type Result = z.infer<typeof ResultSchema>;
