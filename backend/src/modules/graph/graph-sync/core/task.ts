import type { z } from "zod";

export interface BaseTask {
    taskType: string;
    payload: unknown;
}

export interface GraphSyncTaskDefinition<
    TSchema extends z.ZodType = z.ZodType,
> {
    name: string;
    schema: TSchema;
    execute: (data: z.infer<TSchema>) => Promise<BaseTask>;
}

export type GraphSyncTaskExecutor = (payload: unknown) => Promise<BaseTask>;

export interface GraphSyncTask {
    name: string;
    execute: GraphSyncTaskExecutor;
}

export function defineGraphSyncTask<TSchema extends z.ZodType>(
    task: GraphSyncTaskDefinition<TSchema>,
): GraphSyncTask {
    return {
        name: task.name,
        execute: async (payload) => {
            const data = task.schema.parse(payload);
            return task.execute(data);
        },
    };
}
