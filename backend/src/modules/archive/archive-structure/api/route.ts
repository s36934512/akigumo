import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "post",
    path: "/archive/structure",
    summary: "瀏覽 檔案 結構",
    description: "",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: RequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ResponseSchema,
                },
            },
            description: "Archive structure retrieved successfully.",
        },
    },
});
