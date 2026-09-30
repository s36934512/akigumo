import { z } from "zod";

import { createEventCodes } from "#app/contracts/index.js";
import * as Paths from "#app/infrastructure/storage/paths.js";
import { defineProcessor, NonRetryableError } from "#app/kernel/index.js";
import { getOrCreateDefaultExt } from "#app/modules/archive/archive-integration/extension/default.js";
import {
    ArchiveStatus,
    ArchiveType,
    FileStatus,
} from "#generated/prisma/enums.js";

import { ArchiveIntentSchema } from "../../api/schema.js";
import * as service from "../service.js";
import { hasEnoughSpace } from "./disk-guard.js";

export const ARCHIVE_INTENT = "ARCHIVE_INTENT";

export const archiveIntentProcessor = defineProcessor(
    ARCHIVE_INTENT,
    ArchiveIntentSchema.single,
    async (input) => {
        const inputFileList = input.payload.fileList;
        const totalSize = inputFileList.reduce(
            (acc, f) => acc + BigInt(f.size),
            BigInt(0),
        );

        if (!(await hasEnoughSpace(Paths.TMP_TUS, Number(totalSize)))) {
            throw new NonRetryableError("磁碟空間不足");
        }

        const defaultExt = await getOrCreateDefaultExt();

        const fileList = inputFileList.map((f) => ({
            id: f.id,
            originalName: f.name,
            size: f.size,
            isOriginal: true,
            ...(f.metadata !== undefined && {
                metadata: f.metadata,
            }),
            status: FileStatus.UPLOADING,
            fileExtensionId: defaultExt.id,
        }));

        const itemList = fileList.map((f) => ({
            id: f.id,
            name: f.originalName,
            type: ArchiveType.FILE_CONTAINER,
            status: ArchiveStatus.PROCESSING,
        }));

        await service.createItemFile({ fileList, itemList });

        return {
            notifyId: input.payload.notifyId,
            batchId: input.payload.batchId,
            fileList: fileList.map((f) => f.id),
        };
    },
);

export const ArchiveIntentEvents = createEventCodes(ARCHIVE_INTENT, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            notifyId: z.uuid(),
            batchId: z.uuid(),
            fileList: z.uuid().array(),
        }),
    },
]);
