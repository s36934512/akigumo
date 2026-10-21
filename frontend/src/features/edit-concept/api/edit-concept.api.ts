import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#app/shared/api";
import type { PostApiV1OntologyEditorBody } from "#app/shared/api/model";

@Injectable()
export class EditConceptApi {
    private readonly api = inject(DefaultService);

    edit(input: PostApiV1OntologyEditorBody["registryList"]) {
        return this.api.postApiV1OntologyEditor({
            registryList: input,
        });
    }
}
