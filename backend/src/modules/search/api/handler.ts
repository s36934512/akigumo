import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { searchArchive } from "../archive-search-index/core/service.js";
import { searchConcept } from "../ontology-search-index/core/service.js";
import { route } from "./route.js";
import { SearchQueryTypeSchema } from "./schema.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleSearchRoute = app.openapi(route, async (c) => {
    const query = c.req.valid("query");

    const options = {
        limit: query.limit,
        offset: query.offset,
    };

    switch (query.type) {
        case SearchQueryTypeSchema.enum.archive: {
            const result = await searchArchive(query.q, options);

            return c.json(
                {
                    resultList: result.hits.map((item) => ({
                        ...item,
                        entityType: SearchQueryTypeSchema.enum.archive,
                    })),
                    total: result.estimatedTotalHits ?? result.hits.length,
                    ...options,
                },
                200,
            );
        }

        case SearchQueryTypeSchema.enum.concept: {
            const result = await searchConcept(query.q, options);

            return c.json(
                {
                    resultList: result.hits.map((item) => ({
                        ...item,
                        entityType: SearchQueryTypeSchema.enum.concept,
                    })),
                    total: result.estimatedTotalHits ?? result.hits.length,
                    ...options,
                },
                200,
            );
        }

        case SearchQueryTypeSchema.enum.all: {
            const [archiveResult, conceptResult] = await Promise.all([
                searchArchive(query.q, options),
                searchConcept(query.q, options),
            ]);

            const archiveResultList = archiveResult.hits.map((item) => ({
                ...item,
                entityType: SearchQueryTypeSchema.enum.archive,
            }));

            const conceptResultList = conceptResult.hits.map((item) => ({
                ...item,
                entityType: SearchQueryTypeSchema.enum.concept,
            }));

            const resultList = [...archiveResultList, ...conceptResultList];

            const total =
                (archiveResult.estimatedTotalHits ??
                    archiveResult.hits.length) +
                (conceptResult.estimatedTotalHits ?? conceptResult.hits.length);

            return c.json(
                {
                    resultList,
                    total,
                    ...options,
                },
                200,
            );
        }
    }
});
