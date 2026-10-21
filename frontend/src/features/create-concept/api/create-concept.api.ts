import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#app/shared/api";
import type { PostApiV1OntologyRegistryBody } from "#app/shared/api/model";

@Injectable()
export class CreateConceptApi {
    private readonly api = inject(DefaultService);

    create(input: PostApiV1OntologyRegistryBody["registryList"]) {
        return this.api.postApiV1OntologyRegistry({
            registryList: input,
        });
    }
}
