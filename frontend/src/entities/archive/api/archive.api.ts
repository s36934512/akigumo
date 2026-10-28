import { inject, Service } from "@angular/core";

import { DefaultService } from "#app/shared/api";

@Service()
export class ArchiveApi {
    private readonly defaultService = inject(DefaultService);

    public getList() {
        return this.defaultService.postApiV1ArchiveStructure({});
    }

    public getChildren(archiveId: string) {
        return this.defaultService.postApiV1ArchiveStructure({
            parentId: archiveId,
            showDeleted: false,
        });
    }

    public getReferenceByConcept(conceptId: string) {
        return this.defaultService.getApiV1ArchiveReferenceConceptId(conceptId);
    }

    public getById(archiveId: string) {
        return this.defaultService.getApiV1ArchiveArchiveId(archiveId);
    }
}
