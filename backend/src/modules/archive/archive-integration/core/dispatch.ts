import type { Prisma } from "#app/generated/prisma/client.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { NonRetryableError } from "#app/kernel/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";

import { WORKFLOW_TYPE } from "../machine/machine.js";
import { analyzeFile } from "./file-analysis.js";
import { resolveFileProcessingStrategy } from "./strategy.js";

export async function dispatchFile({
    fileIdList,
    correlationId,
    uncompressMaxDepth,
}: {
    fileIdList: string[];
    correlationId?: string;
    uncompressMaxDepth: number;
}) {
    if (fileIdList.length === 0) {
        throw new NonRetryableError(
            "At least one file is required for dispatch.",
        );
    }

    const fileList = await prisma.file.findMany({
        where: {
            id: {
                in: fileIdList,
            },
        },
        select: {
            id: true,
            physicalPath: true,
            originalName: true,
            metadata: true,
        },
    });

    if (fileList.length !== fileIdList.length) {
        const foundIdSet = new Set(fileList.map((file) => file.id));

        const missingFileIdList = fileIdList.filter(
            (fileId) => !foundIdSet.has(fileId),
        );

        throw new NonRetryableError(
            `File not found: ${missingFileIdList.join(", ")}`,
        );
    }

    const dispatchItemList = await Promise.all(
        fileList.map(async (file) => {
            if (!file.physicalPath) {
                throw new NonRetryableError(
                    `File ${file.id} does not have a physical path.`,
                );
            }

            const analysis = await analyzeFile(
                file.physicalPath,
                file.originalName,
            );

            const strategy = resolveFileProcessingStrategy(
                analysis.extensionCode,
            );

            return {
                file,
                analysis,
                strategy,
            };
        }),
    );

    await prisma.$transaction(async (tx) => {
        for (const { file, analysis, strategy } of dispatchItemList) {
            const fileId = file.id;

            const metadata: Prisma.JsonObject = {
                ...(file.metadata &&
                typeof file.metadata === "object" &&
                !Array.isArray(file.metadata)
                    ? file.metadata
                    : {}),
                ...(analysis.metadata ?? {}),
            };

            await tx.file.update({
                where: {
                    id: fileId,
                },
                data: {
                    size: analysis.size,
                    checksum: analysis.checksum,
                    extensionCode: analysis.extensionCode,
                    mimeType: analysis.mimeType,
                    metadata,
                },
            });

            await tx.workflowState.create({
                data: {
                    id: fileId,
                    workflowType: WORKFLOW_TYPE,
                    status: "INIT",
                    correlationId,
                },
            });

            await tx.outbox.create({
                data: {
                    workflowId: fileId,
                    operation: WORKFLOW_BOOTSTRAP,
                    payload: {
                        fileId,
                        uncompressMaxDepth,
                        strategy,
                    },
                },
            });
        }
    });

    return {
        fileIdList: dispatchItemList.map((item) => item.file.id),
    };
}
