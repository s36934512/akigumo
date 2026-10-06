import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "post",
    path: "/ontology/resolver",
    summary: "取得實體圖形與資訊",
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
            description: "成功",
        },
        400: {
            description: "請求格式錯誤",
        },
    },
});
