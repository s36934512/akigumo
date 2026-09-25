import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";

import { FILE_CATEGORY_DEFS } from "./constants.js";

export async function syncFileExtensions() {
    await prisma.$transaction(async (tx) => {
        for (const category of Object.values(FILE_CATEGORY_DEFS)) {
            const fileCategory = await tx.fileCategory.upsert({
                where: {
                    code: category.code,
                },
                update: {
                    name: category.name,
                    description: category.description,
                },
                create: {
                    code: category.code,
                    name: category.name,
                    description: category.description,
                },
            });

            for (const extension of category.extensions) {
                await tx.fileExtension.upsert({
                    where: {
                        code: extension.code,
                    },
                    update: {
                        name: extension.name,
                        mimeType: extension.mimeType,

                        categoryId: fileCategory.id,
                    },
                    create: {
                        code: extension.code,
                        name: extension.name,
                        mimeType: extension.mimeType,

                        categoryId: fileCategory.id,
                    },
                });
            }
        }
    });

    logger.info(
        {
            module: "File",
            operation: "sync",
        },
        "File category and extension catalog synchronized.",
    );
}
