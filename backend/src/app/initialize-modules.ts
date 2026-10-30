import { initializeArchiveSearchIndex } from "#app/modules/search/archive-search-index/index.js";
import { initializeConceptSearchIndex } from "#app/modules/search/ontology-search-index/index.js";

export async function initializeModules(): Promise<void> {
    await initializeArchiveSearchIndex();
    await initializeConceptSearchIndex();
}
