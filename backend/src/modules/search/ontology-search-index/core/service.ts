import { meilisearchClient } from "#app/infrastructure/meilisearch/client.js";
import { getSearchIndex } from "#app/infrastructure/meilisearch/index.js";

import type { ConceptSearchDocument } from "./document.js";

const conceptSearchIndex = getSearchIndex("concepts");

export async function upsertConceptSearchDocument(
    document: ConceptSearchDocument,
): Promise<void> {
    const task = await conceptSearchIndex.addDocuments([document]);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function upsertConceptSearchDocumentBatch(
    documentList: ConceptSearchDocument[],
): Promise<void> {
    if (documentList.length === 0) {
        return;
    }

    const task = await conceptSearchIndex.addDocuments(documentList);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function deleteConceptSearchDocument(id: string): Promise<void> {
    const task = await conceptSearchIndex.deleteDocument(id);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}

export async function deleteConceptSearchDocumentBatch(
    idList: string[],
): Promise<void> {
    if (idList.length === 0) {
        return;
    }

    const task = await conceptSearchIndex.deleteDocuments(idList);

    await meilisearchClient.tasks.waitForTask(task.taskUid);
}
