import { Component, input, output } from "@angular/core";

@Component({
    selector: "widget-archive-browser-toolbar",
    standalone: true,
    templateUrl: "./archive-browser-toolbar.component.html",
})
export class ArchiveBrowserToolbarComponent {
    readonly searchQuery = input("");
    readonly columnCount = input.required<number>();
    readonly canDecreaseColumnCount = input.required<boolean>();
    readonly canIncreaseColumnCount = input.required<boolean>();
    readonly sortDirection = input<"asc" | "desc">("desc");

    readonly searchQueryChange = output<string>();
    readonly decreaseColumnCount = output<void>();
    readonly increaseColumnCount = output<void>();
    readonly sortDirectionChange = output<"asc" | "desc">();

    protected toggleSortDirection(): void {
        this.sortDirectionChange.emit(
            this.sortDirection() === "desc" ? "asc" : "desc",
        );
    }
}
