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
    fileIdList,
    correlationId,
    uncompressMaxDepth,
}: {
    fileIdList: string[];
    correlationId?: string;
    uncompressMaxDepth: number;
}) {
    const fileList = await prisma.file.findMany({
        where: {
            id: {
                in: fileIdList,
            },
        },
    });

    if (!fileList.length) {
        throw new NonRetryableError(`Files not found`);
    }

    if (fileList.length < fileIdList.length) {
        const foundIds = fileList.map((f) => f.id);
        const missingIds = fileIdList.filter((id) => !foundIds.includes(id));

        throw new NonRetryableError(`File not found`, missingIds);
    }

    const fileProcessList = await Promise.all(
        fileList.map(async (file) => {
            if (!file.physicalPath) {
                throw new NonRetryableError(`File ${file.id} not found`);
            }

            const analysis = await analyzeFile(
                file.physicalPath,
                file.originalName,
            );

            const strategy =
                FILE_PROCESSING_STRATEGIES[
                    resolveStrategyKey(analysis.categoryCode)
                ];

            return {
                file,
                analysis,
                strategy,
            };
        }),
    );

    await prisma.$transaction(async (tx) => {
        await tx.workflowState.createMany({
            data: fileProcessList.map(({ file }) => ({
                id: file.id,
                workflowType: WORKFLOW_TYPE,
                status: "INIT",
                correlationId,
                uncompressMaxDepth,
            })),
        });

        for (const { file, analysis } of fileProcessList) {
            await tx.file.update({
                where: {
                    id: file.id,
                },
                data: {
                    size: analysis.size,
                    checksum: analysis.checksum,
                    fileExtensionId: analysis.extensionId,
                    metadata: {
                        ...((file.metadata ?? {}) as Record<string, unknown>),
                        ...analysis.metadata,
                    },
                },
            });
        }
    });

    return {};
}
