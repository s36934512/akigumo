import { DestroyRef, inject, Service } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { SseBrokerService } from "#app/shared/services/sse-broker.service";
import { conceptListQueryKey } from "./concept.query";

@Service()
export class ConceptSync {
    private readonly queryClient = inject(QueryClient);
    private readonly sseBrokerService = inject(SseBrokerService);
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        const streamUrl = "/api/v1/stream";

        const unregisterGraphChanged = this.sseBrokerService.registerHandler(
            streamUrl,
            "GRAPH_CHANGED",
            () => {
                void this.queryClient.invalidateQueries({
                    queryKey: conceptListQueryKey,
                });
            },
        );

        this.sseBrokerService.listen(streamUrl);

        this.destroyRef.onDestroy(() => {
            unregisterGraphChanged();
        });
    }
}
