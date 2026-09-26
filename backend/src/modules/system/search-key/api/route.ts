import { createRoute, z } from "@hono/zod-openapi";

export const route = createRoute({
    method: "get",
    path: "/system/search/key",
    summary: "取得前端搜尋 API Key",
    description: "取得供前端使用的 Meilisearch Search API Key。",
    request: {},
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({
                        key: z.string(),
                    }),
                },
            },
            description: "Search API Key",
        },
        500: {
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: "Search API Key not configured",
        },
    },
});
