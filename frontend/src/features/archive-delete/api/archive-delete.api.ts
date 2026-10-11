import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { PostApiV1ArchiveDeleteBodyItem } from "#generated/model";

@Injectable()
export class ArchiveDeleteApi {
    private readonly api = inject(DefaultService);

    delete(input: PostApiV1ArchiveDeleteBodyItem[]) {
        return this.api.postApiV1ArchiveDelete(input);
    }
}
