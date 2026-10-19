import { Component, computed, inject, signal } from "@angular/core";
import { DrawerModule } from "@openng/optimus-ui/drawer";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { type Archive, ArchiveQuery } from "#app/entities/archive";
import { SelectionStore } from "#app/shared/model/selection-store";
import { ArchiveBrowserComponent } from "#app/widgets/archive-browser";
import { ArchiveDetailPanelComponent } from "./archive-detail-panel/archive-detail-panel.component";

type DetailPanelMode = "inline" | "overlay";

@Component({
    selector: "page-explorer",
    standalone: true,
    imports: [
        ArchiveBrowserComponent,
        ArchiveDetailPanelComponent,
        DrawerModule,
    ],
    templateUrl: "./explorer.component.html",
    styleUrl: "./explorer.component.scss",
    providers: [SelectionStore],
})
export class ExplorerPage {
    private readonly archiveQuery = inject(ArchiveQuery);

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly openedArchiveId = signal<string | null>(null);

    readonly openedArchive = computed(() => {
        const archiveId = this.openedArchiveId();

        if (!archiveId) {
            return null;
        }

        const archiveList = this.archiveListQuery.data() ?? [];

        return archiveList.find((archive) => archive.id === archiveId) ?? null;
    });

    readonly detailPanelMode = signal<DetailPanelMode>("inline");

    protected onArchiveOpen(archiveId: string): void {
        this.openedArchiveId.set(archiveId);
    }

    protected onArchiveClose(): void {
        this.openedArchiveId.set(null);
    }

    protected setDetailPanelMode(mode: DetailPanelMode): void {
        this.detailPanelMode.set(mode);
    }
}
