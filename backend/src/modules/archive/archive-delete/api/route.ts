import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "delete",
    path: "/archive",
    summary: "Move archives to trash",
    description: "將指定的 Archive 移入垃圾桶，並非永久刪除。",
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
        202: {
            content: {
                "application/json": {
                    schema: ResponseSchema,
                },
            },
            description: "已接受刪除請求，回傳流程追蹤 ID。",
        },
        400: {
            description: "請求格式錯誤。",
        },
    },
});
