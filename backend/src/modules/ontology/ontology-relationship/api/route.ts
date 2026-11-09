import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "post",
    path: "/ontology/relationship",
    summary: "取得 Concept 關聯結構",
    description: "取得 Concept 參與的語意關聯、直接關聯及相關實體資料。",
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
