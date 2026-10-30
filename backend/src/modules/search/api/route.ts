import { createRoute } from "@hono/zod-openapi";
import { SearchQuerySchema, SearchResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "get",
    path: "/search",
    request: {
        query: SearchQuerySchema,
    },
    responses: {
        200: {
            description: "Search results",
            content: {
                "application/json": {
                    schema: SearchResponseSchema,
                },
            },
        },
    },
});
