import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import fs from "fs-extra";
import sharp from "sharp";

import * as Paths from "#app/infrastructure/storage/paths.js";

export async function calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash("sha256");
    await pipeline(fs.createReadStream(filePath), hash);
    return hash.digest("hex");
}

export async function convertToWebp(fileDir: string) {
    const sourcePath = Paths.concat(fileDir, "original");
    const targetPath = Paths.concat(fileDir, "compressed.webp");

    const info = await sharp(sourcePath, {
        animated: true,
    })
        .webp()
        .toFile(targetPath);
    const checksum = await calculateChecksum(targetPath);

    return {
        size: BigInt(info.size),
        checksum,
        width: info.width,
        height: info.height,
    };
}
