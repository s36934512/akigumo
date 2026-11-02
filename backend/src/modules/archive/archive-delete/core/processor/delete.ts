import { z } from "zod";

import { defineEventContract } from "#app/contracts/index.js";
import { defineProcessor } from "#app/kernel/index.js";
import { uniqueArray } from "#app/utils/array.js";

import { ArchiveDeleteSchema } from "../../api/schema.js";
import { getArchiveDescendantPathList } from "../graph-repository.js";
import * as service from "../service.js";

export const ARCHIVE_DELETE = "ARCHIVE_DELETE";

export const archiveDeleteProcessor = defineProcessor(
    ARCHIVE_DELETE,
    ArchiveDeleteSchema.single,
    async (input) => {
        const rootIdList = uniqueArray(input.payload.archiveIdList);

        const descendantPathList =
            await getArchiveDescendantPathList(rootIdList);

        const foundRootIdSet = new Set(
            descendantPathList.map(({ rootArchiveId }) => rootArchiveId),
        );

        const missingRootIdList = rootIdList.filter(
            (id) => !foundRootIdSet.has(id),
        );

        if (missingRootIdList.length > 0) {
            throw new Error(
                `Archive nodes are missing in Neo4j: ${missingRootIdList.join(", ")}`,
            );
        }

        const result = await service.createArchiveDeletion(descendantPathList);

        return {
            deletionIdList: result.deletionIdList,
            archiveIdList: result.archiveIdList,
        };
    },
);

export const ArchiveDeleteEvent = defineEventContract(ARCHIVE_DELETE, [
    {
        code: "SUCCEEDED",
        dataSchema: z.object({
            deletionIdList: z.uuid().array(),
            archiveIdList: z.uuid().array(),
        }),
    },
]);
