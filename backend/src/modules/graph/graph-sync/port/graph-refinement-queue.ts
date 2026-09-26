import type { GraphRefinementRequest } from "#app/contracts/index.js";

export interface GraphRefinementQueue {
    publish(request: GraphRefinementRequest): Promise<void>;
}
