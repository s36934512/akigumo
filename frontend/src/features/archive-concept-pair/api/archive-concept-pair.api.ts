import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#app/shared/api";
import type { PostApiV1ArchiveConceptPairBodyItem } from "#app/shared/api/model";

@Injectable()
export class ArchiveConceptPairApi {
    private readonly api = inject(DefaultService);

    add(input: PostApiV1ArchiveConceptPairBodyItem[]) {
        return this.api.postApiV1ArchiveConceptPair(input);
    }
}
