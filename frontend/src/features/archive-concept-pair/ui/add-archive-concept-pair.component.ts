import {
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "@openng/optimus-ui/button";
import { CheckboxModule } from "@openng/optimus-ui/checkbox";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";
import { InputTextModule } from "@openng/optimus-ui/inputtext";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive";
import { ConceptQuery } from "#app/entities/concept";
import type { PostApiV1ArchiveConceptPairBodyItem } from "#app/shared/api/model";
import { searchConcept } from "#app/shared/lib/concept-search";
import { SelectionStore } from "#app/shared/model/selection-store";

import { ArchiveConceptPairApi } from "../api/archive-concept-pair.api";
import { ArchiveConceptPairMutation } from "../api/archive-concept-pair.mutation";
import { ArchiveConceptPairStore } from "../model/archive-concept-pair.store";

type AddMode = "existing" | "create";

type PairItem = PostApiV1ArchiveConceptPairBodyItem["pairList"][number];

type Statement = PairItem["statement"];
type ValueItem = PairItem["value"][number];

interface PairDraft {
    statement: Statement;
    statementLabel: string;
    value: ValueItem[];
    valueLabelList: string[];
}

@Component({
    selector: "feature-add-archive-concept-pair",
    standalone: true,
    imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule],
    providers: [
        ArchiveConceptPairApi,
        ArchiveConceptPairMutation,
        ArchiveConceptPairStore,
        SelectionStore,
    ],
    templateUrl: "./add-archive-concept-pair.component.html",
    styleUrl: "./add-archive-concept-pair.component.scss",
})
export class AddArchiveConceptPairComponent {
    private readonly dialogRef = inject(DynamicDialogRef);
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly conceptQuery = inject(ConceptQuery);

    readonly archiveId = input.required<string>();
    readonly saved = output<void>();

    readonly store = inject(ArchiveConceptPairStore);
    readonly archiveConceptPairMutation = inject(ArchiveConceptPairMutation);
    readonly valueSelectionStore = inject(SelectionStore);

    // Statement
    readonly statementMode = signal<AddMode>("existing");
    readonly statementConceptId = signal<string | null>(null);
    readonly newStatementName = signal("");

    // Value
    readonly newValueName = signal("");
    readonly newValueNameList = signal<string[]>([]);

    // 尚未提交的 Pair 草稿
    readonly pairList = signal<PairDraft[]>([]);

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

    // Statement 和 Value 使用獨立的搜尋條件
    readonly filteredStatementList = computed(() =>
        searchConcept(this.conceptList(), this.store.statementSearchKeyword()),
    );

    readonly filteredValueList = computed(() =>
        searchConcept(this.conceptList(), this.store.valueSearchKeyword()),
    );

    readonly isPending = computed(() =>
        this.archiveConceptPairMutation.add.isPending(),
    );

    readonly canAddPair = computed(() => {
        if (
            this.isPending() ||
            this.conceptListQuery.isPending() ||
            this.conceptListQuery.isError()
        ) {
            return false;
        }

        const hasStatement =
            this.statementMode() === "existing"
                ? this.conceptList().some(
                      (concept) => concept.id === this.statementConceptId(),
                  )
                : this.newStatementName().trim().length > 0;

        const hasValue =
            this.valueSelectionStore.hasSelection() ||
            this.newValueNameList().length > 0;

        return hasStatement && hasValue;
    });

    readonly canSubmit = computed(() => {
        return (
            !this.isPending() &&
            !!this.currentArchive() &&
            !this.conceptListQuery.isPending() &&
            !this.conceptListQuery.isError() &&
            this.pairList().length > 0
        );
    });

    setStatementSearchKeyword(keyword: string): void {
        this.store.setStatementSearchKeyword(keyword);
    }

    setValueSearchKeyword(keyword: string): void {
        this.store.setValueSearchKeyword(keyword);
    }

    setStatementMode(mode: AddMode): void {
        this.statementMode.set(mode);
        this.statementConceptId.set(null);
        this.newStatementName.set("");
    }

    toggleValueSelection(id: string, checked: boolean): void {
        if (checked) {
            this.valueSelectionStore.select(id);
        } else {
            this.valueSelectionStore.deselect(id);
        }
    }

    addNewValue(): void {
        const name = this.newValueName().trim();

        if (!name) {
            return;
        }

        const exists = this.newValueNameList().some(
            (item) => item.toLocaleLowerCase() === name.toLocaleLowerCase(),
        );

        if (exists) {
            return;
        }

        this.newValueNameList.update((current) => [...current, name]);
        this.newValueName.set("");
    }

    removeNewValue(name: string): void {
        this.newValueNameList.update((current) =>
            current.filter((item) => item !== name),
        );
    }

    addPair(): void {
        if (!this.canAddPair()) {
            return;
        }

        const statement = this.resolveStatement();
        const values = this.resolveValues();

        if (!statement || values.length === 0) {
            return;
        }

        this.pairList.update((current) => [
            ...current,
            {
                statement: statement.payload,
                statementLabel: statement.label,
                value: values.map((item) => item.payload),
                valueLabelList: values.map((item) => item.label),
            },
        ]);

        this.resetCurrentPair();
    }

    removePair(index: number): void {
        this.pairList.update((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    submit(): void {
        const archive = this.currentArchive();
        const pairs = this.pairList();

        if (!this.canSubmit() || !archive || pairs.length === 0) {
            return;
        }

        const input: PostApiV1ArchiveConceptPairBodyItem[] = [
            {
                targetId: archive.id,
                pairList: pairs.map(({ statement, value }) => ({
                    statement,
                    value,
                })),
            },
        ];

        this.archiveConceptPairMutation.add.mutate(input, {
            onSuccess: () => {
                this.pairList.set([]);
                this.resetCurrentPair();
                this.store.clearSearchKeywords();
                this.saved.emit();
            },
        });
    }

    protected onCancel(): void {
        this.dialogRef.close();
    }

    private resolveStatement(): { payload: Statement; label: string } | null {
        if (this.statementMode() === "create") {
            const name = this.newStatementName().trim();

            return name
                ? {
                      payload: { name },
                      label: name,
                  }
                : null;
        }

        const id = this.statementConceptId();
        const concept = this.conceptList().find((item) => item.id === id);

        return concept
            ? {
                  payload: { id: concept.id },
                  label: concept.name,
              }
            : null;
    }

    private resolveValues(): {
        payload: ValueItem;
        label: string;
    }[] {
        const selectedIds = this.valueSelectionStore.selectedIdSet();

        const existingValues = this.conceptList()
            .filter((concept) => selectedIds.has(concept.id))
            .map((concept) => ({
                payload: { id: concept.id } as ValueItem,
                label: concept.name,
            }));

        const newValues = this.newValueNameList().map((name) => ({
            payload: { name } as ValueItem,
            label: name,
        }));

        return [...existingValues, ...newValues];
    }

    private resetCurrentPair(): void {
        this.statementMode.set("existing");
        this.statementConceptId.set(null);
        this.newStatementName.set("");
        this.valueSelectionStore.clearSelection();
        this.newValueName.set("");
        this.newValueNameList.set([]);
    }
}
