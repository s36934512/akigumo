import { Component, inject, input } from "@angular/core";
import { ButtonModule } from "@openng/optimus-ui/button";

import { ArchiveConceptRemoveApi } from "../api/archive-concept-remove.api";
import { ArchiveConceptRemoveMutation } from "../api/archive-concept-remove.mutation";

@Component({
    selector: "feature-archive-info-archive-concept-remove",
    standalone: true,
    imports: [ButtonModule],
    templateUrl: "./archive-concept-remove.component.html",
    providers: [ArchiveConceptRemoveApi, ArchiveConceptRemoveMutation],
})
export class ArchiveConceptRemoveComponent {
    private readonly mutation = inject(ArchiveConceptRemoveMutation);

    readonly archiveId = input.required<string>();
    readonly conceptId = input.required<string>();

    protected readonly isPending = this.mutation.remove.isPending;

    protected onRemove(): void {
        this.mutation.remove.mutate([
            {
                targetId: this.archiveId(),
                conceptIdList: [this.conceptId()],
            },
        ]);
    }
}
