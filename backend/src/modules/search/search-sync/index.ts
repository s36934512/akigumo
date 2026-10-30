import { syncSearchEntity } from "./worker/search-sync-handler.js";
import type { SearchSyncWorkerOptions } from "./worker/search-sync-worker.js";
import { SearchSyncWorker } from "./worker/search-sync-worker.js";

export function createSearchSyncWorker(
    logger: SearchSyncWorkerOptions["logger"],
): SearchSyncWorker {
    return new SearchSyncWorker({
        sync: syncSearchEntity,
        logger,
    });
}
