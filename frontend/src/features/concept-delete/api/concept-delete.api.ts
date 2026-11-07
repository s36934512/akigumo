import { Injectable, inject } from "@angular/core";

import { DefaultService } from "#generated/index";
import type { DeleteApiV1OntologyBody } from "#generated/model";

@Injectable()
export class ConceptDeleteApi {
    private readonly api = inject(DefaultService);

    delete(input: DeleteApiV1OntologyBody) {
        return this.api.deleteApiV1Ontology(input);
    }
}
