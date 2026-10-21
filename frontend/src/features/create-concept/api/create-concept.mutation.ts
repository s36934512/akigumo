import { Injectable, inject } from "@angular/core";
import {
    injectMutation,
    QueryClient,
} from "@tanstack/angular-query-experimental";

import { conceptListQueryKey } from "#app/entities/concept";
import type { PostApiV1OntologyRegistryBody } from "#app/shared/api/model";

import { CreateConceptApi } from "./create-concept.api";

@Injectable()
export class CreateConceptMutation {
    private readonly createConceptApi = inject(CreateConceptApi);
    private readonly queryClient = inject(QueryClient);

    readonly create = injectMutation(() => ({
        mutationFn: (input: PostApiV1OntologyRegistryBody["registryList"]) =>
            this.createConceptApi.create(input),
        onSuccess: () =>
            this.queryClient.invalidateQueries({
                queryKey: conceptListQueryKey,
            }),
    }));
}
