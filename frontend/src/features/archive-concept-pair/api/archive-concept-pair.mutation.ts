import { Injectable, inject } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import type { PostApiV1ArchiveConceptPairBodyItem } from "#app/shared/api/model";

import { ArchiveConceptPairApi } from "./archive-concept-pair.api";

@Injectable()
export class ArchiveConceptPairMutation {
    private readonly archiveConceptPairApi = inject(ArchiveConceptPairApi);

    readonly add = injectMutation(() => ({
        mutationFn: (input: PostApiV1ArchiveConceptPairBodyItem[]) =>
            this.archiveConceptPairApi.add(input),
    }));
}
