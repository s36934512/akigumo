import { JsonPipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ConceptQuery } from "#app/entities/concept";
import { CreateConceptComponent } from "#app/features/create-concept";
import { EditConceptComponent } from "#app/features/edit-concept";
import { ViewConceptArchiveComponent } from "#app/features/view-concept-archive";
import { searchConcept } from "#app/shared/lib/concept-search";
import { SelectionStore } from "#app/shared/model/selection-store";

@Component({
    selector: "page-concept",
    standalone: true,
    imports: [JsonPipe, ViewConceptArchiveComponent],
    templateUrl: "./concept.component.html",
    providers: [SelectionStore, DialogService],
})
export class ConceptPageComponent {
    private readonly dialogService = inject(DialogService);
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

    protected onEditConcept(): void {
        const concept = this.selectedConcept();

        if (!concept) return;

        this.dialogService.open(EditConceptComponent, {
            header: "編輯 Concept",
            width: "40rem",
            modal: true,
            inputValues: {
                concept: concept,
            },
        });
    }

    protected onCreateConcept(): void {
        this.dialogService.open(CreateConceptComponent, {
            header: "新增 Concept",
            width: "40rem",
            modal: true,
        });
    }
}
