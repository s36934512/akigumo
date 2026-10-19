import { Component, inject, input, output } from "@angular/core";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";

import type { Archive } from "#app/entities/archive";
import { AddArchiveConceptComponent } from "#app/features/archive-concept";
import { ArchiveInfoComponent } from "#app/features/archive-info";

@Component({
    selector: "page-explorer-archive-detail-panel",
    standalone: true,
    imports: [ArchiveInfoComponent],
    providers: [DialogService],
    templateUrl: "./archive-detail-panel.component.html",
    styleUrl: "./archive-detail-panel.component.scss",
})
export class ArchiveDetailPanelComponent {
    private readonly dialogService = inject(DialogService);

    readonly archive = input.required<Archive>();
    readonly closed = output<void>();

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
}
