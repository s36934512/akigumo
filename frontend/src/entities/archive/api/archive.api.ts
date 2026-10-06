import { inject, Service } from "@angular/core";

import { DefaultService } from "#app/shared/api";

@Service()
export class ArchiveApi {
    private readonly defaultService = inject(DefaultService);

    public getList() {
        return this.defaultService.postApiV1ArchiveStructure({});
    }
}
