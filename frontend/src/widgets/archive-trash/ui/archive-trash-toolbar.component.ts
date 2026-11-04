import { Component, input, output } from "@angular/core";

import { ArchiveGridLayoutComponent } from "#app/features/archive-grid-layout";

@Component({
    selector: "widget-archive-trash-toolbar",
    standalone: true,
    imports: [ArchiveGridLayoutComponent],
    templateUrl: "./archive-trash-toolbar.component.html",
})
export class ArchiveTrashToolbarComponent {
    readonly columnCount = input.required<number>();
    readonly canDecreaseColumnCount = input.required<boolean>();
    readonly canIncreaseColumnCount = input.required<boolean>();

    readonly decreaseColumnCount = output<void>();
    readonly increaseColumnCount = output<void>();
}
