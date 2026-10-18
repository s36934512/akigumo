import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#app/shared/api";
import type { PostApiV1ArchiveConceptBodyItem } from "#app/shared/api/model";

@Injectable()
export class ArchiveConceptApi {
    private readonly api = inject(DefaultService);

    add(input: PostApiV1ArchiveConceptBodyItem[]) {
        return this.api.postApiV1ArchiveConcept(input);
    }
}
