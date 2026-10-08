import { fileTypeFromFile } from "file-type";
import fs from "fs-extra";
import sharp from "sharp";

import type { Prisma } from "#app/generated/prisma/client.js";
import * as Paths from "#app/infrastructure/storage/paths.js";

import { calculateChecksum } from "./helper.js";

export async function analyzeFile(
    physicalPath: string,
    fileName: string | null,
) {
    const stat = await fs.stat(physicalPath);

    const fileType = await fileTypeFromFile(physicalPath);

    const mimeType = fileType?.mime ?? null;

    const extensionCode =
        fileType?.ext ?? (fileName ? Paths.ext(fileName) || null : null);

    const checksum = await calculateChecksum(physicalPath);

    const metadata = await analyzeMetadata(physicalPath, mimeType);

    return {
        size: stat.size,
        checksum,
        extensionCode,
        mimeType,
        metadata,
    };
}

async function analyzeMetadata(
    physicalPath: string,
    mimeType: string | null,
): Promise<Prisma.JsonObject | null> {
    if (!mimeType?.startsWith("image/")) {
        return null;
    }

    try {
        const metadata = await sharp(physicalPath).metadata();

        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
        };
    } catch {
        return null;
    }
}
