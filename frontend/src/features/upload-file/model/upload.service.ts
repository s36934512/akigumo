import { DestroyRef, Injectable, inject } from "@angular/core";
import { Tus, Uppy } from "uppy";
import { v7 as uuidv7 } from "uuid";

import { UploadApi } from "../api/upload.api";
import {
    type ScannedFile,
    ScannedFileSchema,
    type UppyFileMeta,
    type UppyFileResponse,
} from "./schema";

@Injectable()
export class UploadService {
    private readonly destroyRef = inject(DestroyRef);
    private readonly uploadApi = inject(UploadApi);

    private uppy: Uppy<UppyFileMeta, UppyFileResponse> | null = null;
    private fileScanMap = new Map<string, File>();

    constructor() {
        this.initUppy();

        this.destroyRef.onDestroy(() => {
            this.disconnect();
        });
    }

    private initUppy() {
        if (!this.uppy) {
            this.uppy = new Uppy<UppyFileMeta, UppyFileResponse>({
                restrictions: {
                    maxFileSize: 10 * 1024 * 1024 * 1024,
                }, // 10GB
                autoProceed: true,
            }).use(Tus, {
                endpoint: "/api/v1/tus/files",
                uploadDataDuringCreation: true,
                chunkSize: 5 * 1024 * 1024, // 5MB
                retryDelays: [0, 1000, 3000, 5000],
                removeFingerprintOnSuccess: true, // 上傳成功後自動清除快取
            });
        }

        if (!this.uppy) {
            throw new Error("Uppy 實例初始化失敗");
        }
    }

    // --- 核心流程：掃描 -> Intent -> Upload ---
    async addFilesFromDataTransfer(items: DataTransferItemList) {
        if (!this.uppy) return;

        const scannedFiles: ScannedFile["array"] = [];

        const entries = Array.from(items)
            .map((item) => item.webkitGetAsEntry())
            .filter((entry): entry is FileSystemEntry => entry !== null);

        await this.traverseFileTree(entries, (file, entry) => {
            const fileId = uuidv7();

            this.fileScanMap.set(fileId, file);

            scannedFiles.push(
                ScannedFileSchema.single.parse({
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    metadata: {
                        path: entry.fullPath.replace(/^\//, ""),
                    },
                }),
            );
        });

        try {
            await this.uploadApi.intent({
                fileList: scannedFiles,
            });

            for (const scannedFile of scannedFiles) {
                this.startUppyUpload(scannedFile);
            }
        } catch (err) {
            console.error("[upload service] 送出 Intent 失敗:", err);
        }
    }

    private startUppyUpload(scannedFile: ScannedFile["single"]) {
        const file = this.fileScanMap.get(scannedFile.id);

        if (!file || !this.uppy) return;

        this.uppy.addFile({
            source: "drag-n-drop",
            name: file.name,
            type: file.type,
            data: file,
            meta: {
                fileId: scannedFile.id,
            },
        });
    }

    /**
     * Accepts a FileList from a <input webkitdirectory> element and queues all
     * files for upload, preserving the relative folder path via webkitRelativePath.
     */
    async addFilesFromFolderInput(fileList: FileList) {
        if (!this.uppy || fileList.length === 0) return;

        const scannedFiles: ScannedFile["array"] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            const fileId = uuidv7();

            this.fileScanMap.set(fileId, file);

            scannedFiles.push(
                ScannedFileSchema.single.parse({
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    metadata: {
                        // webkitRelativePath includes the top-level folder name, e.g. "myFolder/sub/file.jpg"
                        path: file.webkitRelativePath || file.name,
                    },
                }),
            );
        }

        try {
            await this.uploadApi.intent({
                fileList: scannedFiles,
            });

            for (const scannedFile of scannedFiles) {
                this.startUppyUpload(scannedFile);
            }
        } catch (err) {
            console.error("[upload service] 送出 Intent 失敗:", err);
        }
    }

    // --- 輔助方法：遞迴掃描 ---
    private async traverseFileTree(
        entries: FileSystemEntry[],
        onFile: (file: File, entry: FileSystemFileEntry) => void,
    ) {
        for (const entry of entries) {
            if (entry.isFile) {
                const file = await this.getFileFromEntry(
                    entry as FileSystemFileEntry,
                );

                onFile(file, entry as FileSystemFileEntry);
            } else if (entry.isDirectory) {
                const dirEntries = await this.readAllDirectoryEntries(
                    entry as FileSystemDirectoryEntry,
                );

                await this.traverseFileTree(dirEntries, onFile);
            }
        }
    }

    private getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File> {
        return new Promise((resolve, reject) =>
            fileEntry.file(resolve, reject),
        );
    }

    private async readAllDirectoryEntries(
        dirEntry: FileSystemDirectoryEntry,
    ): Promise<FileSystemEntry[]> {
        const reader = dirEntry.createReader();

        let results: FileSystemEntry[] = [];

        const read = async (): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) =>
                reader.readEntries(resolve, reject),
            );
        };

        let entries = await read();

        while (entries.length > 0) {
            results = results.concat(entries);
            entries = await read();
        }

        return results;
    }

    disconnect() {
        if (this.uppy) this.uppy.cancelAll();

        this.fileScanMap.clear();
    }
}
