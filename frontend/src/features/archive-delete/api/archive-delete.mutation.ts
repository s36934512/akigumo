import { Injectable, inject } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import type { PostApiV1ArchiveDeleteBody } from "#app/shared/api/model";

import { ArchiveDeleteApi } from "./archive-delete.api";

@Injectable()
export class ArchiveDeleteMutation {
    private readonly archiveDeleteApi = inject(ArchiveDeleteApi);

    readonly delete = injectMutation(() => ({
        mutationFn: (input: PostApiV1ArchiveDeleteBody) =>
            this.archiveDeleteApi.delete(input),
    }));
}
