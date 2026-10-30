import { Component, output } from "@angular/core";

import { SearchPanelComponent } from "#app/features/search";

@Component({
    selector: "widget-search-overlay",
    standalone: true,
    imports: [SearchPanelComponent],
    templateUrl: "./search-overlay.component.html",
})
export class SearchOverlayComponent {
    readonly close = output<void>();

    protected onBackdropClick(): void {
        this.close.emit();
    }
}
