import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildTask } from "../factory/tag-provisioning.js";

const PayloadSchema = z.uuid().array();

export const conceptRegistryTask = defineGraphSyncTask({
    name: "concept-registry",
    schema: PayloadSchema,
    execute: async (payload) => {
        const conceptList = await prisma.concept.findMany({
            where: {
                id: {
                    in: payload,
                },
            },
        });

        if (conceptList.length === 0) {
            throw new Error("concept not found");
        }

        return {
            taskType: "ConceptRegistryExecutor",
            payload: conceptList.map((concept) => {
                return buildTask({
                    conceptId: concept.id,
                    conceptName: concept.name,
                });
            }),
        };
    },
});
