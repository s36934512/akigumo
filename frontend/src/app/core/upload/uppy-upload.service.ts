import { Injectable } from "@angular/core";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";

@Injectable({
    providedIn: "root",
})
export class UppyUploadService {
    private readonly uppy = new Uppy();

    constructor() {
        this.uppy.use(Tus, {
            endpoint: "/api/v1/tus/files",
        });

        this.uppy.on("upload-success", (file, response) => {
            console.log("TUS upload success", {
                file,
                response,
            });
        });

        this.uppy.on("upload-error", (file, error) => {
            console.error("TUS upload error", {
                file,
                error,
            });
        });
    }

    addFile(file: File): void {
        this.uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
        });
    }

    upload() {
        return this.uppy.upload();
    }
}
