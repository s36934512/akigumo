import { Component, computed, inject, input } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import type { Archive } from "#app/entities/archive";
import { ConceptChipComponent, ConceptQuery } from "#app/entities/concept";

import { ArchiveConceptRemoveComponent } from "./archive-concept-remove";

@Component({
    selector: "feature-archive-info",
    standalone: true,
    imports: [ConceptChipComponent, ArchiveConceptRemoveComponent],
    templateUrl: "./archive-info.component.html",
    styleUrl: "./archive-info.component.scss",
})
export class ArchiveInfoComponent {
    private readonly conceptQuery = inject(ConceptQuery);

    readonly archive = input.required<Archive>();

    readonly conceptListQuery = injectQuery(() => this.conceptQuery.list());

    readonly conceptNodeMap = computed(() => {
        const nodes = this.conceptListQuery.data()?.nodes ?? [];

        return new Map(nodes.map((concept) => [concept.id, concept]));
    });

    readonly conceptEntryList = computed(() => {
        const archive = this.archive();
        const conceptNodeMap = this.conceptNodeMap();

        return (
            archive.conceptList?.flatMap((item) => {
                if (!item.conceptId) return [];

                const concept = conceptNodeMap.get(item.conceptId);
                if (!concept) return [];

                return [{ concept, type: item.type }];
            }) ?? []
        );
    });
}
