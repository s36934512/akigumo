import { Injectable, inject } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import type { PostApiV1ArchiveConceptBodyItem } from "#app/shared/api/model";

import { ArchiveConceptApi } from "./archive-concept.api";

@Injectable()
export class ArchiveConceptMutation {
    private readonly archiveConceptApi = inject(ArchiveConceptApi);

    readonly add = injectMutation(() => ({
        mutationFn: (input: PostApiV1ArchiveConceptBodyItem[]) =>
            this.archiveConceptApi.add(input),
    }));
}
