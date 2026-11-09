import { inject, Service } from "@angular/core";

import { DefaultService } from "#app/shared/api";

@Service()
export class ConceptApi {
    private readonly defaultService = inject(DefaultService);

    public getList() {
        return this.defaultService.postApiV1OntologyResolver({
            operate: "ALL",
            showDeleted: false,
        });
    }

    public getRelationship(conceptId: string) {
        return this.defaultService.postApiV1OntologyRelationship({
            conceptId,
        });
    }
}
