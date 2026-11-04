import { Injectable, inject } from "@angular/core";
import {
    injectMutation,
    QueryClient,
} from "@tanstack/angular-query-experimental";

import {
    archiveListQueryKey,
    archiveTrashQueryKey,
} from "#app/entities/archive";
import type { PostApiV1ArchiveRestoreBody } from "#app/shared/api/model";

import { ArchiveRestoreApi } from "./archive-restore.api";

@Injectable()
export class ArchiveRestoreMutation {
    private readonly archiveRestoreApi = inject(ArchiveRestoreApi);
    private readonly queryClient = inject(QueryClient);

    readonly restore = injectMutation(() => ({
        mutationFn: (input: PostApiV1ArchiveRestoreBody) =>
            this.archiveRestoreApi.restore(input),
        onSuccess: () => {
            this.queryClient.invalidateQueries({
                queryKey: archiveTrashQueryKey(),
            });

            this.queryClient.invalidateQueries({
                queryKey: archiveListQueryKey,
            });
        },
    }));
}
