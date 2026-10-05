import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { ArchiveStore } from "#app/entities/archive/model/archive.model";
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
    private readonly archiveStore = inject(ArchiveStore);

    protected readonly archives = this.archiveStore.archives;
}
