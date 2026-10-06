import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";

import { ConceptApi } from "../api/concept.api";
import type { Concept, ConceptEdge } from "./concept";

export const conceptQueryKey = ["concept"] as const;

export const conceptListQueryKey = [...conceptQueryKey, "list"] as const;

export interface ConceptGraph {
    nodes: Concept[];
    edges: ConceptEdge[];
}

@Service()
export class ConceptQuery {
    private readonly conceptApi = inject(ConceptApi);

    public list() {
        return queryOptions({
            queryKey: conceptListQueryKey,

            queryFn: async (): Promise<ConceptGraph> => {
                const response = await this.conceptApi.getList();

                const nodeList: Concept[] = [];
                const edgeList: ConceptEdge[] = [];

                for (const node of response.nodes) {
                    nodeList.push(node.data);
                }

                for (const edge of response.edges) {
                    edgeList.push(edge.data);
                }

                return {
                    nodes: nodeList,
                    edges: edgeList,
                };
            },
        });
    }
}
