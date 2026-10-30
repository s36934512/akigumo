import { Meilisearch } from "meilisearch";

import { env } from "#app/config/env.js";

export const meilisearchClient = new Meilisearch({
    host: env.meilisearch.host,
    apiKey: env.meilisearch.apiKey,
});
