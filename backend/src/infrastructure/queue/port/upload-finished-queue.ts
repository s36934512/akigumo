export interface UploadFinishedQueue {
    add(message: { fileId: string; uploadId: string }): Promise<void>;

    close(): Promise<void>;
}
