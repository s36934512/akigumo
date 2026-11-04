import {
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from "@angular/core";

import type { ArchiveDeletionSummary } from "#app/entities/archive";
import { ArchiveCardComponent } from "#app/entities/archive/ui/archive-card.component";
import { SelectionStore } from "#app/shared/model/selection-store";
import { OverlayCoordinatorService } from "#app/shared/ui/overlay-panel";

import { ArchiveTrashToolbarComponent } from "./archive-trash-toolbar.component";

const DEFAULT_COLUMN_COUNT = 6;
const MIN_COLUMN_COUNT = 1;
const MAX_COLUMN_COUNT = 12;

@Component({
    selector: "widget-archive-trash",
    standalone: true,
    imports: [ArchiveCardComponent, ArchiveTrashToolbarComponent],
    templateUrl: "./archive-trash.component.html",
    styleUrl: "./archive-trash.component.scss",
    providers: [OverlayCoordinatorService],
})
export class ArchiveTrashComponent {
    private readonly selectionStore = inject(SelectionStore);

    readonly deletionList = input.required<ArchiveDeletionSummary[]>();
    readonly selectionMode = input(false);

    protected readonly columnCount = signal(DEFAULT_COLUMN_COUNT);

    readonly archiveOpen = output<string>();
    readonly archiveDoubleClick = output<string>();

    readonly selectedIdSet = this.selectionStore.selectedIdSet;

    readonly isEmpty = computed(() => this.deletionList().length === 0);

    protected onArchiveClick(deletionId: string, archiveId: string): void {
        if (this.selectionMode()) {
            this.selectionStore.toggleSelect(deletionId);
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
