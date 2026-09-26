import { z } from "zod";

import { prisma } from "#app/infrastructure/database/prisma.js";

import { defineGraphSyncTask } from "../core/task.js";
import { buildItemContainTask } from "../factory/item-contain.js";

export const PayloadSchema = z.object({
    itemId: z.uuid(),
    childrenItemIds: z.array(z.uuid()).min(1, "至少包含一個子項目"),
});

export type ItemContainPayload = z.infer<typeof PayloadSchema>;

async function itemContainHandler(payload: ItemContainPayload) {
    const { itemId, childrenItemIds } = payload;

    const item = await prisma.archive.findUnique({
        where: {
            id: itemId,
        },
    });

    if (!item) {
        throw new Error("Item not found");
    }

    const childrenItems = await prisma.archive.findMany({
        where: {
            id: {
                in: childrenItemIds,
            },
        },
    });

    if (!childrenItems || childrenItems.length === 0) {
        throw new Error("Children items not found");
    }

    const task = buildItemContainTask({
        itemId,
        itemName: item.name,
        childrenItemIds: childrenItems.map((item) => item.id),
    });

    return {
        taskType: "ItemExecutor",
        payload: task,
    };
}

export const itemContainTask = defineGraphSyncTask({
    name: "item-contain",
    schema: PayloadSchema,
    execute: itemContainHandler,
});
