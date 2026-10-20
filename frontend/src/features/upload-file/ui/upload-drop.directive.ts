import {
    Directive,
    HostBinding,
    HostListener,
    inject,
    output,
} from "@angular/core";

import { UploadService } from "../model/upload-file.service";

@Directive({
    selector: "[featuresUploadDrop]",
    standalone: true,
})
export class UploadDropDirective {
    private readonly uploadService = inject(UploadService);

    readonly draggingChange = output<boolean>();

    private dragDepth = 0;

    @HostBinding("class.archive-browser--dragging")
    protected isDragging = false;

    @HostListener("dragenter", ["$event"])
    onDragEnter(event: DragEvent): void {
        if (!this.hasFiles(event)) {
            return;
        }

        event.preventDefault();
        this.dragDepth++;

        if (!this.isDragging) {
            this.isDragging = true;
            this.draggingChange.emit(true);
        }
    }

    @HostListener("dragover", ["$event"])
    onDragOver(event: DragEvent): void {
        if (!this.hasFiles(event)) {
            return;
        }

        event.preventDefault();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }
    }

    @HostListener("dragleave", ["$event"])
    onDragLeave(event: DragEvent): void {
        if (!this.isDragging) {
            return;
        }

        this.dragDepth = Math.max(0, this.dragDepth - 1);

        if (this.dragDepth === 0) {
            this.setDragging(false);
        }
    }

    @HostListener("drop", ["$event"])
    onDrop(event: DragEvent): void {
        event.preventDefault();

        const isFileDrop = this.hasFiles(event);
        const items = event.dataTransfer?.items;

        this.resetDragging();

        if (isFileDrop && items) {
            void this.uploadService.addFilesFromDataTransfer(items);
        }
    }

    private hasFiles(event: DragEvent): boolean {
        return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    private setDragging(value: boolean): void {
        this.isDragging = value;
        this.draggingChange.emit(value);
    }

    private resetDragging(): void {
        this.dragDepth = 0;

        if (this.isDragging) {
            this.setDragging(false);
        }
    }
}
