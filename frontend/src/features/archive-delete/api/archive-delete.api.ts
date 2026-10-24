import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { PostApiV1ArchiveDeleteBody } from "#generated/model";

@Injectable()
export class ArchiveDeleteApi {
    private readonly api = inject(DefaultService);

    delete(input: PostApiV1ArchiveDeleteBody) {
        return this.api.postApiV1ArchiveDelete(input);
    }
}
