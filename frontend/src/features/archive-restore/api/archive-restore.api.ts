import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { PostApiV1ArchiveRestoreBody } from "#generated/model";

@Injectable()
export class ArchiveRestoreApi {
    private readonly api = inject(DefaultService);

    restore(input: PostApiV1ArchiveRestoreBody) {
        return this.api.postApiV1ArchiveRestore(input);
    }
}
