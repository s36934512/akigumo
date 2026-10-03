import { Directive, HostListener, inject } from "@angular/core";

import { UploadService } from "../model/upload.service";

@Directive({
    selector: "[featuresUploadDrop]",
    standalone: true,
})
export class UploadDropDirective {
    private readonly uploadService = inject(UploadService);

    @HostListener("drop", ["$event"])
    onDrop(event: DragEvent) {
        event.preventDefault();

        if (!event.dataTransfer) {
            return;
        }

        this.uploadService.addFilesFromDataTransfer(event.dataTransfer.items);
    }

    @HostListener("dragover", ["$event"])
    onDragOver(event: DragEvent) {
        event.preventDefault();
    }
}
