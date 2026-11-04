import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { DeleteApiV1ArchiveBody } from "#generated/model";

@Injectable()
export class ArchiveDeleteApi {
    private readonly api = inject(DefaultService);

    delete(input: DeleteApiV1ArchiveBody) {
        return this.api.deleteApiV1Archive(input);
    }
}
