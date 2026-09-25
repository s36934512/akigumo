import { z } from "zod";

import { createFlexibleSchema, type InferFlexible } from "#app/schema/index.js";

const BaseTaskSchema = z.object({
    taskType: z.string(),
    payload: z.any(),
});

export type BaseTask = z.infer<typeof BaseTaskSchema>;

export const GraphSyncSchema = createFlexibleSchema(
    z.object({
        handlerName: z.string(),
        payload: z.unknown(),
    }),
);

export type GraphSync = InferFlexible<typeof GraphSyncSchema>;

export const TaskSchema = BaseTaskSchema.extend({
    id: z.uuid(),
}).transform((data) => {
    return {
        id: data.id,
        taskVersion: 1,
        taskType: data.taskType,
        taskPayload: data.payload,
    };
});
