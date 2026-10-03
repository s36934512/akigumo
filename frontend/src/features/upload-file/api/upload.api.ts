import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { PostApiV1ArchiveIntentBody } from "#generated/model";

@Injectable()
export class UploadApi {
    private readonly api = inject(DefaultService);

    intent(input: PostApiV1ArchiveIntentBody) {
        return this.api.postApiV1ArchiveIntent(input);
    }
}
