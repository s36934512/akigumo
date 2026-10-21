import { createRoute, z } from "@hono/zod-openapi";

export const route = createRoute({
    method: "get",
    path: "/archive/reference/{conceptId}",
    summary: "List archives referencing a concept",
    description:
        "Returns the IDs of non-deleted archives that reference the specified concept.",
    request: {
        params: z.object({
            conceptId: z.uuid().openapi({ description: "Concept UUID" }),
        }),
    },
    responses: {
        200: {
            description: "List of archive IDs",
            content: {
                "application/json": {
                    schema: z.uuid().array(),
                },
            },
        },
    },
});
