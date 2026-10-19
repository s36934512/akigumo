import { Component, computed, inject, input, output } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { type Archive, ArchiveQuery } from "#app/entities/archive";
import { ArchiveCardComponent } from "#app/entities/archive/ui/archive-card.component";
import { SelectionStore } from "#app/shared/model/selection-store";

@Component({
    selector: "widget-archive-browser",
    standalone: true,
    imports: [ArchiveCardComponent],
    templateUrl: "./archive-browser.component.html",
    styleUrl: "./archive-browser.component.scss",
})
export class ArchiveBrowserComponent {
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly selectionStore = inject(SelectionStore);

    readonly selectionMode = input(false);

    readonly archiveOpen = output<string>();

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly archiveList = computed(() => this.archiveListQuery.data() ?? []);

    readonly selectedIdSet = this.selectionStore.selectedIdSet;

    readonly isEmpty = computed(() => this.archiveList().length === 0);

    protected onArchiveClick(archive: Archive): void {
        if (this.selectionMode()) {
            this.selectionStore.toggleSelect(archive.id);
            return;
        }

        this.archiveOpen.emit(archive.id);
    }

    protected isSelected(archiveId: string): boolean {
        return this.selectedIdSet().has(archiveId);
    }
}
