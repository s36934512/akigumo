import { GRAPH_INTENT_CREATED } from "./core/index.js";

export { createGraphSyncProcessor } from "./core/index.js";
export function createSyncIntentOutbox(handlerName: string, payload: unknown) {
    return {
        operation: GRAPH_INTENT_CREATED,
        payload: {
            handlerName,
            payload,
        },
    };
}
