import { computed, DestroyRef, inject, Service, signal } from "@angular/core";

import { SseBrokerService } from "#app/shared/services/sse-broker.service";

import { ArchiveApi } from "../api/archive.api";
import {
    ArchiveChangedPayloadSchema,
    ArchiveDeletedPayloadSchema,
} from "../api/sse";
import { type Archive, ArchiveSchema } from "./types";

@Service()
export class ArchiveStore {
    private readonly archiveApi = inject(ArchiveApi);
    private readonly sseBrokerService = inject(SseBrokerService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly archiveMap = signal(new Map<string, Archive>());

    readonly archives = computed(() => [...this.archiveMap().values()]);

    constructor() {
        const streamUrl = `/api/v1/stream`;

        const unregisterChanged = this.sseBrokerService.registerHandler(
            streamUrl,
            "ARCHIVE_CHANGED",
            (payload) => {
                const result = ArchiveChangedPayloadSchema.safeParse(payload);

                if (!result.success) {
                    return;
                }

                void this.load();
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

                this.delete(result.data.id);
            },
        );

        this.destroyRef.onDestroy(() => {
            unregisterChanged();
            unregisterDeleted();
        });

        this.sseBrokerService.listen(streamUrl);

        void this.load();
    }

    private async load(): Promise<void> {
        const response = await this.archiveApi.getList();

        const archiveMap = new Map<string, Archive>();

        for (const item of response) {
            const result = ArchiveSchema.safeParse(item);

            if (!result.success) {
                continue;
            }

            archiveMap.set(result.data.id, result.data);
        }

        this.archiveMap.set(archiveMap);
    }

    private delete(id: string): void {
        this.archiveMap.update((archiveMap) => {
            if (!archiveMap.has(id)) {
                return archiveMap;
            }

            const nextMap = new Map(archiveMap);
            nextMap.delete(id);

            return nextMap;
        });
    }

    public refetch(): void {
        void this.load();
    }

    public get(id: string): Archive | undefined {
        return this.archiveMap().get(id);
    }
}
