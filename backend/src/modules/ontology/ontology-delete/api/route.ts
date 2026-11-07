import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "delete",
    path: "/ontology",
    summary: "刪除實體",
    description: "刪除指定實體及其關聯。",
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
            description: "刪除請求已接受，回傳流程追蹤 ID",
        },
        400: {
            description: "請求格式錯誤",
        },
    },
});
