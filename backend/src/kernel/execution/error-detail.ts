import { type ErrorDetail, ErrorDetailSchema } from "#app/contracts/index.js";

import type { NonRetryableError } from "./error.js";

export function toErrorDetail(error: NonRetryableError): ErrorDetail {
    const result = ErrorDetailSchema.safeParse(error.payload);

    if (result.success) {
        return result.data;
    }

    return {
        code: "KERNEL_NON_RETRYABLE_ERROR",
        message: error.message,
        details: error.payload,
    };
}
