import { Component, inject } from "@angular/core";

import { UppyUploadService } from "./uppy-upload.service";

@Component({
    selector: "app-upload-test",
    template: `
        <input
            type="file"
            (change)="onFileSelected($event)"
        />

        <button
            type="button"
            (click)="upload()"
        >
            Upload
        </button>
    `,
})
export class UploadTestComponent {
    private readonly uploadService = inject(UppyUploadService);

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        this.uploadService.addFile(file);
    }

    async upload(): Promise<void> {
        const result = await this.uploadService.upload();

        console.log("Upload result", result);
    }
}
