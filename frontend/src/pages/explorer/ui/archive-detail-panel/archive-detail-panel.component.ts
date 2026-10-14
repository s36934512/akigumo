import { Component, input, output } from "@angular/core";

import type { Archive } from "#app/entities/archive";

@Component({
    selector: "page-explorer-archive-detail-panel",
    standalone: true,
    templateUrl: "./archive-detail-panel.component.html",
    styleUrl: "./archive-detail-panel.component.scss",
})
export class ArchiveDetailPanelComponent {
    readonly archive = input.required<Archive>();
    readonly closed = output<void>();

    protected onClose(): void {
        this.closed.emit();
    }
}
