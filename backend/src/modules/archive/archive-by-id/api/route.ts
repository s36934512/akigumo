import { createRoute, z } from "@hono/zod-openapi";

import { ResponseSchema } from "./schema.js";

export const route = createRoute({
    method: "get",
    path: "/archive/{archiveId}",
    summary: "瀏覽 檔案 結構",
    description: "",
    request: {
        params: z.object({
            archiveId: z.uuid().openapi({ description: "Archive UUID" }),
        }),
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
        404: {
            description: "Archive not found.",
        },
    },
});
