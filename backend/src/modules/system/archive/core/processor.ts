import fs from "fs-extra";

import * as service from "./service.js";

export async function archiveServeProcessor(fileId: string) {
    try {
        const metadata = await service.getFileMetadata(fileId);
        const filePath = metadata.physicalPath;

        if (!filePath || !fs.pathExistsSync(filePath)) {
            return null;
        }

        return { filePath, mimeType: metadata.mimeType };
    } catch {
        return null;
    }
}
