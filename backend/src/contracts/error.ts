import { z } from "zod";

export const ErrorDetailSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
