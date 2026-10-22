import { Component, inject, input, output, signal } from "@angular/core";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";

import type { Archive } from "#app/entities/archive";
import { AddArchiveConceptComponent } from "#app/features/archive-concept";
import { AddArchiveConceptPairComponent } from "#app/features/archive-concept-pair";
import { ArchiveInfoComponent } from "#app/features/archive-info";

type ArchiveDetailSection = "info" | "content";

@Component({
    selector: "widget-archive-detail",
    standalone: true,
    imports: [ArchiveInfoComponent],
    providers: [DialogService],
    templateUrl: "./archive-detail.component.html",
    styleUrl: "./archive-detail.component.scss",
})
export class ArchiveDetailComponent {
    private readonly dialogService = inject(DialogService);

    readonly archive = input.required<Archive>();
    readonly back = output<void>();

    readonly activeSection = signal<ArchiveDetailSection>("info");
    readonly imageError = signal(false);

    protected setSection(section: ArchiveDetailSection): void {
        this.activeSection.set(section);
    }

    protected onBack(): void {
        this.back.emit();
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

    protected onImageError(): void {
        this.imageError.set(true);
    }
}
