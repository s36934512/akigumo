import { Injectable, inject } from "@angular/core";
import {
    injectMutation,
    QueryClient,
} from "@tanstack/angular-query-experimental";

import { conceptListQueryKey } from "#app/entities/concept";
import type { PostApiV1OntologyEditorBody } from "#app/shared/api/model";

import { EditConceptApi } from "./edit-concept.api";

@Injectable()
export class EditConceptMutation {
    private readonly editConceptApi = inject(EditConceptApi);
    private readonly queryClient = inject(QueryClient);

    readonly edit = injectMutation(() => ({
        mutationFn: (input: PostApiV1OntologyEditorBody["registryList"]) =>
            this.editConceptApi.edit(input),
        onSuccess: () =>
            this.queryClient.invalidateQueries({
                queryKey: conceptListQueryKey,
            }),
    }));
}
