import { Component, computed, inject, input } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive";

@Component({
    selector: "feature-view-concept-archive",
    standalone: true,
    templateUrl: "./view-concept-archive.component.html",
})
export class ViewConceptArchiveComponent {
    private readonly archiveQuery = inject(ArchiveQuery);

    readonly conceptId = input.required<string>();

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly referenceQuery = injectQuery(() =>
        this.archiveQuery.referenceByConcept(this.conceptId()),
    );

    readonly availableList = computed(() => {
        const reference = this.referenceQuery.data() ?? [];
        const archiveList = this.archiveListQuery.data() ?? [];
        const referenceSet = new Set(reference);

        return archiveList.filter((archive) => referenceSet.has(archive.id));
    });
}
