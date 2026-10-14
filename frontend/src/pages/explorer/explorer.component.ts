import { Component } from "@angular/core";

import { SelectionStore } from "#app/shared/model/selection-store";
import { ArchiveBrowserComponent } from "#app/widgets/archive-browser";

@Component({
    selector: "page-explorer",
    standalone: true,
    imports: [ArchiveBrowserComponent],
    templateUrl: "./explorer.component.html",
    styleUrl: "./explorer.component.scss",
    providers: [SelectionStore],
})
export class ExplorerPage {}
