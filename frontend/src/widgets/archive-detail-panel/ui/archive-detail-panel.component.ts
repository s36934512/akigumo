import { Component, inject, input, output } from "@angular/core";
import { MessageService } from "@openng/optimus-ui/api";
import { ButtonModule } from "@openng/optimus-ui/button";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";

import type { Archive, ArchiveDeletionSummary } from "#app/entities/archive";
import { AddArchiveConceptComponent } from "#app/features/archive-concept";
import { AddArchiveConceptPairComponent } from "#app/features/archive-concept-pair";
import { ArchiveDeleteDialogComponent } from "#app/features/archive-delete";
import { ArchiveInfoComponent } from "#app/features/archive-info";
import {
    ArchiveRestoreMutation,
    archiveRestoreProviders,
} from "#app/features/archive-restore";

type ArchiveDetailMode = "normal" | "trash";

@Component({
    selector: "widget-archive-detail-panel",
    standalone: true,
    imports: [ArchiveInfoComponent, ButtonModule],
    providers: [DialogService, MessageService, archiveRestoreProviders],
    templateUrl: "./archive-detail-panel.component.html",
    styleUrl: "./archive-detail-panel.component.scss",
})
export class ArchiveDetailPanelComponent {
    private readonly dialogService = inject(DialogService);
    private readonly archiveRestoreMutation = inject(ArchiveRestoreMutation);

    readonly archive = input.required<Archive>();
    readonly mode = input<ArchiveDetailMode>("normal");
    readonly deletion = input<ArchiveDeletionSummary | null>(null);

    readonly closed = output<void>();
    readonly restored = output<void>();

    protected onClose(): void {
        this.closed.emit();
    }

    protected onAddConcept(): void {
        this.dialogService.open(AddArchiveConceptComponent, {
            header: "新增 Concept",
            width: "40rem",
            modal: true,
            inputValues: {
                archiveId: this.archive().id,
            },
        });
    }

    protected onAddConceptPair(): void {
        this.dialogService.open(AddArchiveConceptPairComponent, {
            header: "新增 Concept Pair",
            width: "40rem",
            modal: true,
            inputValues: {
                archiveId: this.archive().id,
            },
        });
    }

    protected onDelete(): void {
        this.dialogService.open(ArchiveDeleteDialogComponent, {
            header: "刪除 Archive",
            width: "32rem",
            modal: true,
            inputValues: {
                archiveIdList: [this.archive().id],
            },
        });
    }

    protected onRestore(): void {
        const deletion = this.deletion();

        if (!deletion) {
            return;
        }

        this.archiveRestoreMutation.restore.mutate(
            {
                deletionIdList: [deletion.id],
            },
            {
                onSuccess: () => this.restored.emit(),
            },
        );
    }
}
