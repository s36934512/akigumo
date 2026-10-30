import { meilisearchClient } from "#app/infrastructure/meilisearch/client.js";
import { getSearchIndex } from "#app/infrastructure/meilisearch/index.js";

import type { ArchiveSearchDocument } from "./document.js";

const archiveSearchIndex = getSearchIndex("archives");

export async function upsertArchiveSearchDocument(
    document: ArchiveSearchDocument,
): Promise<void> {
    const task = await archiveSearchIndex.addDocuments([document]);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function upsertArchiveSearchDocumentBatch(
    documentList: ArchiveSearchDocument[],
): Promise<void> {
    if (documentList.length === 0) {
        return;
    }

    const task = await archiveSearchIndex.addDocuments(documentList);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function deleteArchiveSearchDocument(id: string): Promise<void> {
    const task = await archiveSearchIndex.deleteDocument(id);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function deleteArchiveSearchDocumentBatch(
    idList: string[],
): Promise<void> {
    if (idList.length === 0) {
        return;
    }

    const task = await archiveSearchIndex.deleteDocuments(idList);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}
