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

const DEFAULT_COLUMN_COUNT = 6;
const MIN_COLUMN_COUNT = 1;
const MAX_COLUMN_COUNT = 12;

@Component({
    selector: "widget-archive-browser",
    standalone: true,
    imports: [ArchiveCardComponent, UploadDropDirective],
    templateUrl: "./archive-browser.component.html",
    styleUrl: "./archive-browser.component.scss",
    providers: [uploadProviders],
})
export class ArchiveBrowserComponent {
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly selectionStore = inject(SelectionStore);

    readonly selectionMode = input(false);

    readonly columnCount = input(DEFAULT_COLUMN_COUNT, {
        transform: (value: number) =>
            Math.min(
                MAX_COLUMN_COUNT,
                Math.max(MIN_COLUMN_COUNT, Math.floor(value)),
            ),
    });

    readonly archiveOpen = output<string>();
    readonly archiveDoubleClick = output<string>();

    protected readonly isDraggingFiles = signal(false);

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly archiveList = computed(() => this.archiveListQuery.data() ?? []);

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
}
