import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#app/shared/api";
import type { PostApiV1ArchiveConceptRemoveBodyItem } from "#app/shared/api/model";

@Injectable()
export class ArchiveConceptRemoveApi {
    private readonly api = inject(DefaultService);

    remove(input: PostApiV1ArchiveConceptRemoveBodyItem[]) {
        return this.api.postApiV1ArchiveConceptRemove(input);
    }
}
