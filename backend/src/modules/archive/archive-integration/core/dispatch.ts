import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { type FileTypeResult, fileTypeFromFile } from "file-type";
import fs, { type Stats } from "fs-extra";
import mime from "mime-types";
import sharp from "sharp";

import { prisma } from "#app/infrastructure/database/prisma.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { getFileExtensionId } from "#app/modules/system/file/index.js";

import { FILE_PROCESSING_STRATEGIES } from "../constants.js";
import { WORKFLOW_TYPE } from "../machine/machine.js";
import { resolveStrategyKey } from "./strategy.js";

export async function analyzeFile(path: string, fileName: string | null) {
    let stats: Stats;
    let fileType: FileTypeResult | undefined;

    try {
        [stats, fileType] = await Promise.all([
            fs.stat(path),
            fileTypeFromFile(path),
        ]);
    } catch {
        throw new NonRetryableError("File not found");
    }

    if (!stats.isFile()) {
        throw new NonRetryableError("Not a file");
    }

    const finalExt = fileType?.ext || Paths.ext(fileName || "") || "bin";
    const finalMime =
        fileType?.mime ||
        mime.lookup(fileName || "") ||
        "application/octet-stream";

    const { extensionId, conceptId } = await getFileExtensionId(
        finalExt,
        finalMime,
    );
    const extension = await prisma.fileExtension.findUnique({
        where: { id: extensionId },
        include: { category: true },
    });

    const hashStream = crypto.createHash("sha256");
    const isImage = finalMime.startsWith("image/");

    let metadata = {};

    if (isImage) {
        // 一邊讀 Stream 算 Hash，一邊讓 sharp 讀檔案元資料
        const [imageMetadata, _] = await Promise.all([
            sharp(path)
                .metadata()
                .catch(() => null), // 防呆：萬一圖片損毀，不影響 Hash 計算
            pipeline(fs.createReadStream(path), hashStream),
        ]);

        if (imageMetadata) {
            metadata = {
                width: imageMetadata.width,
                height: imageMetadata.height,
            };
        }
    } else {
        // 非圖片檔案：只做 Hash 計算
        await pipeline(fs.createReadStream(path), hashStream);
    }

    const checksum = hashStream.digest("hex");

    return {
        size: stats.size,
        checksum,
        conceptId,
        extensionId,
        extensionCode: finalExt,
        mimeType: finalMime,
        categoryCode: extension?.category.code || "OTHERS",
        metadata,
    };
}

export async function dispatchFile({
    fileId,
    correlationId,
    notifyId,
    uncompressMaxDepth,
}: {
    fileId: string;
    correlationId?: string;
    notifyId?: string;
    uncompressMaxDepth: number;
}) {
    const file = await prisma.file.findUnique({
        where: { id: fileId },
    });
    if (!file?.physicalPath) {
        throw new NonRetryableError(`File ${fileId} not found`);
    }

    const analysis = await analyzeFile(file.physicalPath, file.originalName);
    const strategy =
        FILE_PROCESSING_STRATEGIES[resolveStrategyKey(analysis.categoryCode)];

    await prisma.$transaction([
        prisma.workflowState.create({
            data: {
                id: fileId,
                workflowType: WORKFLOW_TYPE,
                status: "INIT",
                correlationId: correlationId,
            },
        }),

        prisma.file.update({
            where: { id: fileId },
            data: {
                size: analysis.size,
                checksum: analysis.checksum,
                fileExtensionId: analysis.extensionId,
                metadata: {
                    ...((file.metadata ?? {}) as Record<string, unknown>),
                    ...analysis.metadata,
                },
            },
        }),
    ]);

    return {
        fileId,
        strategy,
        uncompressMaxDepth,
        extensionCode: analysis.extensionCode,
        conceptId: analysis.conceptId,
        notifyId,
    };
}
