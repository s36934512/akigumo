import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "post",
    path: "/archive/intent",
    summary: "建立 Tus 上傳意圖",
    description: "在 Tus 正式開始前先建立檔案意圖與暫存狀態。",
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
            description: "建立上傳意圖成功，回傳流程追蹤 ID",
        },
        400: {
            description: "請求格式錯誤",
        },
    },
});
