import { JsonPipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MessageService } from "@openng/optimus-ui/api";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";
import { injectQuery } from "@tanstack/angular-query-experimental";
import type { ElementsDefinition } from "cytoscape";

import { ConceptQuery } from "#app/entities/concept";
import { ConceptDeleteDialogComponent } from "#app/features/concept-delete";
import { CreateConceptComponent } from "#app/features/create-concept";
import { EditConceptComponent } from "#app/features/edit-concept";
import { ViewConceptArchiveComponent } from "#app/features/view-concept-archive";
import { searchConcept } from "#app/shared/lib/concept-search";
import { SelectionStore } from "#app/shared/model/selection-store";
import { ConceptExplorerComponent } from "#app/widgets/concept-explorer";

import { toRelationshipElements } from "../model/relationship.adapter";

@Component({
    selector: "page-concept",
    standalone: true,
    imports: [
        JsonPipe,
        ViewConceptArchiveComponent,
        ConceptExplorerComponent,
        ConceptDeleteDialogComponent,
    ],
    templateUrl: "./concept.component.html",
    providers: [SelectionStore, DialogService, MessageService],
})
export class ConceptPageComponent {
    private readonly dialogService = inject(DialogService);
    private readonly conceptQuery = inject(ConceptQuery);

    protected readonly selectionStore = inject(SelectionStore);

    protected readonly conceptListQuery = injectQuery(() =>
        this.conceptQuery.list(),
    );

    protected readonly relationshipGraphQuery = injectQuery(() =>
        this.conceptQuery.relationship(
            this.selectionStore.singleSelectedId() ?? "",
        ),
    );

    protected readonly searchTerm = signal("");

    protected readonly viewMode = signal<"list" | "graph">("list");

    protected readonly conceptList = computed(
        () => this.conceptListQuery.data()?.nodes ?? [],
    );

    protected readonly edgeList = computed(
        () => this.conceptListQuery.data()?.edges ?? [],
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

    // 全部 Concept 的瀏覽圖，維持原本 Resolver 資料格式。
    protected readonly graphElements = computed<ElementsDefinition>(() => ({
        nodes: this.conceptList().map((concept) => ({
            data: {
                id: concept.id,
                entityId: concept.id,
                entityType: "CONCEPT",
                name: concept.name,
            },
        })),

        edges: this.edgeList().flatMap((edge) => {
            if (
                !this.conceptList().some(
                    (concept) => concept.id === edge.source,
                ) ||
                !this.conceptList().some(
                    (concept) => concept.id === edge.target,
                )
            ) {
                return [];
            }

            return [
                {
                    data: {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: edge.label ?? undefined,
                    },
                },
            ];
        }),
    }));

    // 單一 Concept 的完整關聯圖，使用新的 DTO Adapter。
    protected readonly relationshipGraphElements = computed<ElementsDefinition>(
        () => {
            const response = this.relationshipGraphQuery.data();

            if (!response) {
                return {
                    nodes: [],
                    edges: [],
                };
            }

            return toRelationshipElements(response);
        },
    );

    protected onSearchChange(value: string): void {
        this.searchTerm.set(value);
    }

    protected onConceptSelect(conceptId: string): void {
        this.selectionStore.setSelected([conceptId]);
    }

    protected clearSelection(): void {
        this.selectionStore.clearSelection();
    }

    protected onConceptToggle(conceptId: string): void {
        if (this.selectionStore.singleSelectedId() === conceptId) {
            this.selectionStore.clearSelection();
            return;
        }

        this.selectionStore.setSelected([conceptId]);
    }

    protected onEditConcept(): void {
        const concept = this.selectedConcept();

        if (!concept) return;

        this.dialogService.open(EditConceptComponent, {
            header: "編輯 Concept",
            width: "40rem",
            modal: true,
            inputValues: {
                concept,
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

    protected onDeleteConcept(): void {
        const concept = this.selectedConcept();

        if (!concept) return;

        this.dialogService.open(ConceptDeleteDialogComponent, {
            header: "刪除 Concept",
            width: "40rem",
            modal: true,
            inputValues: {
                conceptIdList: [concept.id],
            },
        });
    }
}
