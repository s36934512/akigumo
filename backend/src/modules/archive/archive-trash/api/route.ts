import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "get",
    path: "/archive/trash",
    summary: "瀏覽 已刪除 檔案",
    description: "",
    request: {
        query: RequestSchema,
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
