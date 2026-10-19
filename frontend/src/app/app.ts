import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { ArchiveSync } from "#app/entities/archive";
import { ConceptSync } from "#app/entities/concept";

@Component({
    imports: [RouterOutlet],
    selector: "app-root",
    styleUrl: "./app.scss",
    templateUrl: "./app.html",
})
export class App {
    private archiveSync = inject(ArchiveSync);
    private conceptSync = inject(ConceptSync);
}
