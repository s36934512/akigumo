import { Component, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { DrawerModule } from "@openng/optimus-ui/drawer";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive";
import { SelectionStore } from "#app/shared/model/selection-store";
import { ArchiveDetailPanelComponent } from "#app/widgets/archive-detail-panel";
import { ArchiveTrashComponent } from "#app/widgets/archive-trash";

type DetailPanelMode = "inline" | "overlay";

@Component({
    selector: "page-archive-trash",
    standalone: true,
    imports: [ArchiveTrashComponent, ArchiveDetailPanelComponent, DrawerModule],
    templateUrl: "./archive-trash-page.component.html",
    styleUrl: "./archive-trash-page.component.scss",
    providers: [SelectionStore],
})
export class ArchiveTrashPageComponent {
    private readonly archiveQuery = inject(ArchiveQuery);
    private readonly router = inject(Router);

    readonly archiveTrashQuery = injectQuery(() => this.archiveQuery.trash());

    readonly deletionList = computed(() => {
        const data = this.archiveTrashQuery.data();

        return data?.type === "trash" ? data.deletionList : [];
    });

    readonly openedArchiveId = signal<string | null>(null);

    readonly openedArchive = computed(() => {
        const archiveId = this.openedArchiveId();

        if (!archiveId) {
            return null;
        }

        return (
            this.deletionList().find(
                (deletion) => deletion.archive?.id === archiveId,
            )?.archive ?? null
        );
    });

    readonly detailPanelMode = signal<DetailPanelMode>("inline");

    protected onArchiveOpen(archiveId: string): void {
        this.openedArchiveId.set(archiveId);
    }

    protected onArchiveClose(): void {
        this.openedArchiveId.set(null);
    }

    protected onArchiveDoubleClick(archiveId: string): void {
        void this.router.navigate(["/archive", archiveId]);
    }

    protected setDetailPanelMode(mode: DetailPanelMode): void {
        this.detailPanelMode.set(mode);
    }
}
