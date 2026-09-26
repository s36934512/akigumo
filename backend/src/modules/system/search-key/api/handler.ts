import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

// import { meili } from "#akigumo/infrastructure/search/meiliSearch.js";

import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleSystemSearchKey = app.openapi(route, async (c) => {
    // const keys = await meili.getKeys();

    // const searchKey = keys.results.find((k) => k.actions.includes("search"));
    const searchKey = { key: "" };

    if (!searchKey) {
        return c.json(
            {
                error: "Search API key is not configured",
            },
            500,
        );
    }

    return c.json(
        {
            key: searchKey.key,
        },
        200,
    );
});
