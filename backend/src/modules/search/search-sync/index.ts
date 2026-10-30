import { syncSearchEntity } from "../worker/search-sync-handler.js";
import {
    SearchSyncWorker,
    type SearchSyncWorkerOptions,
} from "../worker/search-sync-worker.js";

export function createSearchSyncWorker(
    logger: SearchSyncWorkerOptions["logger"],
): SearchSyncWorker {
    return new SearchSyncWorker({
        sync: syncSearchEntity,
        logger,
    });
}
