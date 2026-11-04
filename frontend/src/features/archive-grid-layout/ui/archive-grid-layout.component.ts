import { Component, input, output } from "@angular/core";
import { ButtonModule } from "@openng/optimus-ui/button";
import { IconFieldModule } from "@openng/optimus-ui/iconfield";

@Component({
    selector: "feature-archive-grid-layout",
    standalone: true,
    imports: [ButtonModule, IconFieldModule],
    templateUrl: "./archive-grid-layout.component.html",
})
export class ArchiveGridLayoutComponent {
    readonly columnCount = input.required<number>();
    readonly canDecrease = input.required<boolean>();
    readonly canIncrease = input.required<boolean>();

    readonly decrease = output<void>();
    readonly increase = output<void>();
}
