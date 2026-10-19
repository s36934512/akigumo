import { Injectable, inject } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import type { PostApiV1ArchiveConceptRemoveBodyItem } from "#app/shared/api/model";

import { ArchiveConceptRemoveApi } from "./archive-concept-remove.api";

@Injectable()
export class ArchiveConceptRemoveMutation {
    private readonly archiveConceptRemoveApi = inject(ArchiveConceptRemoveApi);

    readonly remove = injectMutation(() => ({
        mutationFn: (input: PostApiV1ArchiveConceptRemoveBodyItem[]) =>
            this.archiveConceptRemoveApi.remove(input),
    }));
}
