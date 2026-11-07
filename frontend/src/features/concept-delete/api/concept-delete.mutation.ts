import { Injectable, inject } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import type { DeleteApiV1OntologyBody } from "#app/shared/api/model";

import { ConceptDeleteApi } from "./concept-delete.api";

@Injectable()
export class ConceptDeleteMutation {
    private readonly conceptDeleteApi = inject(ConceptDeleteApi);

    readonly delete = injectMutation(() => ({
        mutationFn: (input: DeleteApiV1OntologyBody) =>
            this.conceptDeleteApi.delete(input),
    }));
}
