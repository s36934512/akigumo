import { Component, signal } from "@angular/core";
import { DrawerModule } from "@openng/optimus-ui/drawer";

import type { Archive } from "#app/entities/archive";
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
    readonly openedArchive = signal<Archive | null>(null);
    readonly detailPanelMode = signal<DetailPanelMode>("inline");

    protected onArchiveOpen(archive: Archive): void {
        this.openedArchive.set(archive);
    }

    protected onArchiveClose(): void {
        this.openedArchive.set(null);
    }

    protected setDetailPanelMode(mode: DetailPanelMode): void {
        this.detailPanelMode.set(mode);
    }
}
