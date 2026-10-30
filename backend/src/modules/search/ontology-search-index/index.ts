import type { Settings } from "meilisearch";

import { meilisearchClient } from "#app/infrastructure/meilisearch/client.js";
import { getSearchIndex } from "#app/infrastructure/meilisearch/index.js";

const conceptSearchIndex = getSearchIndex("concepts");

const conceptSearchIndexSettings: Settings = {
    searchableAttributes: ["name", "description"],
    sortableAttributes: ["createdAt", "updatedAt"],
};

export async function initializeConceptSearchIndex(): Promise<void> {
    const task = await conceptSearchIndex.updateSettings(
        conceptSearchIndexSettings,
    );

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}
