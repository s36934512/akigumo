import {
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive";
import { ArchiveCardComponent } from "#app/entities/archive/ui/archive-card.component";
import {
    UploadDropDirective,
    uploadProviders,
} from "#app/features/upload-file";
import { SelectionStore } from "#app/shared/model/selection-store";
import { OverlayCoordinatorService } from "#app/shared/ui/overlay-panel";

import { ArchiveBrowserToolbarComponent } from "./archive-browser-toolbar.component";

const DEFAULT_COLUMN_COUNT = 6;
const MIN_COLUMN_COUNT = 1;
const MAX_COLUMN_COUNT = 12;

@Component({
    selector: "widget-archive-browser",
    standalone: true,
    imports: [
        ArchiveCardComponent,
        UploadDropDirective,
        ArchiveBrowserToolbarComponent,
    ],
    templateUrl: "./archive-browser.component.html",
    styleUrl: "./archive-browser.component.scss",
    providers: [uploadProviders, OverlayCoordinatorService],
})
export class ArchiveBrowserComponent {
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly selectionStore = inject(SelectionStore);

    readonly selectionMode = input(false);

    protected readonly columnCount = signal(DEFAULT_COLUMN_COUNT);

    protected readonly searchQuery = signal("");
    protected readonly sortDirection = signal<"asc" | "desc">("desc");

    readonly archiveOpen = output<string>();
    readonly archiveDoubleClick = output<string>();

    protected readonly isDraggingFiles = signal(false);

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly archiveList = computed(() => {
        const query = this.searchQuery().trim().toLocaleLowerCase();
        const direction = this.sortDirection();

        return [...(this.archiveListQuery.data() ?? [])]
            .filter((archive) =>
                archive.name.toLocaleLowerCase().includes(query),
            )
            .sort((a, b) => {
                const result = a.name.localeCompare(b.name);
                return direction === "asc" ? result : -result;
            });
    });

    readonly selectedIdSet = this.selectionStore.selectedIdSet;

    readonly isEmpty = computed(() => this.archiveList().length === 0);

    protected onArchiveClick(archiveId: string): void {
        if (this.selectionMode()) {
            this.selectionStore.toggleSelect(archiveId);
            return;
        }

        this.archiveOpen.emit(archiveId);
    }

    protected onArchiveDoubleClick(archiveId: string): void {
        this.archiveDoubleClick.emit(archiveId);
    }

    protected isSelected(archiveId: string): boolean {
        return this.selectedIdSet().has(archiveId);
    }

    protected readonly canDecreaseColumnCount = computed(
        () => this.columnCount() > MIN_COLUMN_COUNT,
    );

    protected readonly canIncreaseColumnCount = computed(
        () => this.columnCount() < MAX_COLUMN_COUNT,
    );

    protected decreaseColumnCount(): void {
        this.columnCount.update((count) =>
            Math.max(MIN_COLUMN_COUNT, count - 1),
        );
    }

    protected increaseColumnCount(): void {
        this.columnCount.update((count) =>
            Math.min(MAX_COLUMN_COUNT, count + 1),
        );
    }
}
