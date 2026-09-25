import { v5 as uuidv5 } from "uuid";

import { cacheService } from "#app/infrastructure/cache/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { ONTOLOGY_NAMESPACE } from "#app/modules/ontology/constants.js";

import { FILE_CATEGORY_DEFS } from "./constants.js";

const FILE_EXTENSION_CACHE_TTL_MS = 60 * 60 * 1000;

function getFileExtensionCacheKey(code: string) {
    return `file-extension:${code}`;
}

async function getCategoryByCode(code: string) {
    const category = await prisma.fileCategory.findUnique({
        where: { code },
        select: { id: true },
    });

    if (!category) {
        throw new Error(
            `CRITICAL_DATA_MISSING: FileCategory '${code}' not found.`,
        );
    }

    return category;
}

export async function getFileExtensionId(code: string, mimeType?: string) {
    return cacheService.getOrSet(
        {
            module: "File",
            key: getFileExtensionCacheKey(code),
            ttl: FILE_EXTENSION_CACHE_TTL_MS,
        },
        async () => {
            let categoryId: number;

            if (mimeType) {
                const category = await prisma.fileCategory.findFirst({
                    where: {
                        extensions: {
                            some: { mimeType },
                        },
                    },
                    select: { id: true },
                });

                categoryId =
                    category?.id ??
                    (await getCategoryByCode(FILE_CATEGORY_DEFS.OTHER.code)).id;
            } else {
                categoryId = (
                    await getCategoryByCode(FILE_CATEGORY_DEFS.OTHER.code)
                ).id;
            }

            const extension = await prisma.fileExtension.upsert({
                where: { code },
                update: {},
                create: {
                    code,
                    name: code,
                    mimeType: mimeType ?? "application/octet-stream",
                    categoryId,
                },
                select: { id: true },
            });

            const conceptId = uuidv5(code, ONTOLOGY_NAMESPACE);

            const concept = await prisma.concept.upsert({
                where: { id: conceptId },
                update: {
                    name: code,
                    description: `Auto-generated concept for file extension ${code}`,
                },
                create: {
                    id: conceptId,
                    name: code,
                    description: `Auto-generated concept for file extension ${code}`,
                },
                select: { id: true },
            });

            return {
                extensionId: extension.id,
                conceptId: concept.id,
            };
        },
    );
}
