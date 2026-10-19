import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "@openng/optimus-ui/button";
import { CheckboxModule } from "@openng/optimus-ui/checkbox";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";
import { InputTextModule } from "@openng/optimus-ui/inputtext";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive";
import { ConceptChipComponent, ConceptQuery } from "#app/entities/concept";
import type { PostApiV1ArchiveConceptBodyItem } from "#app/shared/api/model";
import { searchConcept } from "#app/shared/lib/concept-search";
import { SelectionStore } from "#app/shared/model/selection-store";

import { ArchiveConceptApi } from "../api/archive-concept.api";
import { ArchiveConceptMutation } from "../api/archive-concept.mutation";
import { ArchiveConceptStore } from "../model/archive-concept.store";

@Component({
    selector: "feature-add-archive-concept",
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        ConceptChipComponent,
    ],
    providers: [
        ArchiveConceptApi,
        ArchiveConceptMutation,
        ArchiveConceptStore,
        SelectionStore,
    ],
    templateUrl: "./add-archive-concept.component.html",
    styleUrl: "./add-archive-concept.component.scss",
})
export class AddArchiveConceptComponent {
    private readonly dialogRef = inject(DynamicDialogRef);
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly conceptQuery = inject(ConceptQuery);

    readonly archiveId = input.required<string>();

    readonly saved = output<void>();

    readonly store = inject(ArchiveConceptStore);
    readonly selectionStore = inject(SelectionStore);
    readonly archiveConceptMutation = inject(ArchiveConceptMutation);

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly currentArchive = computed(() => {
        const archiveId = this.archiveId();

        return (
            this.archiveListQuery
                .data()
                ?.find((archive) => archive.id === archiveId) ?? null
        );
    });

    readonly conceptListQuery = injectQuery(() => this.conceptQuery.list());

    readonly conceptList = computed(
        () => this.conceptListQuery.data()?.nodes ?? [],
    );

    readonly existingConceptIdSet = computed(() => {
        const conceptList = this.currentArchive()?.conceptList ?? [];

        return new Set(
            conceptList.flatMap((item) =>
                item.conceptId ? [item.conceptId] : [],
            ),
        );
    });

    readonly availableConceptList = computed(() => {
        const existingConceptIdSet = this.existingConceptIdSet();

        return this.conceptList().filter(
            (concept) => !existingConceptIdSet.has(concept.id),
        );
    });

    readonly filteredConceptList = computed(() =>
        searchConcept(this.availableConceptList(), this.store.searchKeyword()),
    );

    readonly isPending = computed(() =>
        this.archiveConceptMutation.add.isPending(),
    );

    setSearchKeyword(keyword: string): void {
        this.store.setSearchKeyword(keyword);
    }

    toggleConceptSelection(id: string): void {
        this.selectionStore.toggleSelect(id);
    }

    submit(): void {
        const archive = this.currentArchive();

        if (
            this.isPending() ||
            !archive ||
            !this.selectionStore.hasSelection()
        ) {
            return;
        }

        const input: PostApiV1ArchiveConceptBodyItem[] = [
            {
                targetId: archive.id,
                conceptIdList: this.selectionStore.selectedIdList(),
                newConceptList: [],
            },
        ];

        this.archiveConceptMutation.add.mutate(input, {
            onSuccess: () => {
                this.selectionStore.clearSelection();
                this.store.clearSearchKeyword();
                this.saved.emit();
            },
        });
    }

    protected onCancel(): void {
        this.dialogRef.close();
    }
}
