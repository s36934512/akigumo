import { JsonPipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ConceptQuery } from "#app/entities/concept";
import { searchConcept } from "#app/shared/lib/concept-search";
import { SelectionStore } from "#app/shared/model/selection-store";

@Component({
    selector: "page-concept",
    standalone: true,
    imports: [JsonPipe],
    templateUrl: "./concept.component.html",
    providers: [SelectionStore],
})
export class ConceptPageComponent {
    private readonly conceptQuery = inject(ConceptQuery);
    protected readonly selectionStore = inject(SelectionStore);

    protected readonly conceptListQuery = injectQuery(() =>
        this.conceptQuery.list(),
    );

    protected readonly searchTerm = signal("");

    protected readonly conceptList = computed(
        () => this.conceptListQuery.data()?.nodes ?? [],
    );

    protected readonly filteredConceptList = computed(() =>
        searchConcept(this.conceptList(), this.searchTerm()),
    );

    protected readonly selectedConcept = computed(() => {
        const selectedId = this.selectionStore.singleSelectedId();

        if (!selectedId) return null;

        return (
            this.conceptListQuery
                .data()
                ?.nodes.find((concept) => concept.id === selectedId) ?? null
        );
    });

    protected onSearchChange(value: string): void {
        this.searchTerm.set(value);
    }

    protected onConceptSelect(conceptId: string): void {
        this.selectionStore.setSelected([conceptId]);
    }

    protected clearSelection(): void {
        this.selectionStore.clearSelection();
    }
}
