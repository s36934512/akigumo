import { createRoute, z } from "@hono/zod-openapi";

export const sseStreamRoute = createRoute({
    method: "get",
    path: "/stream",
    summary: "SSE 事件",
    description: "",
    responses: {
        200: {
            description: "SSE 串流連線成功",
            content: {
                "text/event-stream": {
                    schema: z.string(),
                },
            },
        },
    },
});
