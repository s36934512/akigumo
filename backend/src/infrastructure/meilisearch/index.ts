import { meilisearchClient } from "./client.js";

const indexConfig = {
    archives: {
        uid: "archives",
        primaryKey: "id",
    },
    concepts: {
        uid: "concepts",
        primaryKey: "id",
    },
} as const;

export type SearchIndexName = keyof typeof indexConfig;

export async function initializeSearchIndex(): Promise<void> {
    const { results } = await meilisearchClient.getRawIndexes();

    const existingUidSet = new Set(results.map((index) => index.uid));

    for (const config of Object.values(indexConfig)) {
        if (existingUidSet.has(config.uid)) {
            continue;
        }

        const task = await meilisearchClient.createIndex(config.uid, {
            primaryKey: config.primaryKey,
        });

        await meilisearchClient.tasks.waitForTask(task.taskUid);
    }
}

export function getSearchIndex(name: SearchIndexName) {
    return meilisearchClient.index(indexConfig[name].uid);
}
