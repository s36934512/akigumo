import { DestroyRef, inject, Service } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { SseBrokerService } from "#app/shared/services/sse-broker.service";

import {
    ArchiveChangedPayloadSchema,
    ArchiveDeletedPayloadSchema,
} from "../api/sse";
import { archiveQueryKey } from "./archive.query";

@Service()
export class ArchiveSync {
    private readonly queryClient = inject(QueryClient);
    private readonly sseBrokerService = inject(SseBrokerService);
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        const streamUrl = "/api/v1/stream";

        const unregisterChanged = this.sseBrokerService.registerHandler(
            streamUrl,
            "ARCHIVE_CHANGED",
            (payload) => {
                const result = ArchiveChangedPayloadSchema.safeParse(payload);

                if (!result.success) {
                    return;
                }

                void this.queryClient.invalidateQueries({
                    queryKey: archiveQueryKey,
                });
            },
        );

        const unregisterDeleted = this.sseBrokerService.registerHandler(
            streamUrl,
            "ARCHIVE_DELETED",
            (payload) => {
                const result = ArchiveDeletedPayloadSchema.safeParse(payload);

                if (!result.success) {
                    return;
                }

                void this.queryClient.invalidateQueries({
                    queryKey: archiveQueryKey,
                });
            },
        );

        this.sseBrokerService.listen(streamUrl);

        this.destroyRef.onDestroy(() => {
            unregisterChanged();
            unregisterDeleted();
        });
    }
}
