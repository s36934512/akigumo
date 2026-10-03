export interface UploadFinishedQueue {
    add(fileId: string): Promise<void>;

    close(): Promise<void>;
}
