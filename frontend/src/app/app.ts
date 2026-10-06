import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { ArchiveQuery } from "#app/entities/archive/model/archive.query";
import { uploadProviders } from "#app/features/upload-file/providers";
import { UploadDropDirective } from "#app/features/upload-file/ui/upload-drop.directive";

@Component({
    imports: [RouterOutlet, UploadDropDirective],
    selector: "app-root",
    styleUrl: "./app.scss",
    templateUrl: "./app.html",
    providers: [uploadProviders],
})
export class App {
    private readonly archiveQuery = inject(ArchiveQuery);

    protected readonly archives = injectQuery(() => this.archiveQuery.list());
}
