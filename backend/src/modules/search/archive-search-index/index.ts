import type { Settings } from "meilisearch";

import { meilisearchClient } from "#app/infrastructure/meilisearch/client.js";
import { getSearchIndex } from "#app/infrastructure/meilisearch/index.js";

const archiveSearchIndex = getSearchIndex("archives");

const archiveSearchIndexSettings: Settings = {
    searchableAttributes: ["name", "description"],
    filterableAttributes: ["type", "status"],
    sortableAttributes: ["publishedDate", "createdAt", "updatedAt"],
};

export async function initializeArchiveSearchIndex(): Promise<void> {
    const task = await archiveSearchIndex.updateSettings(
        archiveSearchIndexSettings,
    );

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}
