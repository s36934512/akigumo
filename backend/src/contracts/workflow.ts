import { z } from "zod";

import { ErrorDetailSchema } from "./error.js";

type EventDefinition = {
    code: string;
    dataSchema: z.ZodType;
};

type EventContract<
    TProcessor extends string,
    TDefinition extends readonly EventDefinition[],
> = {
    [TItem in TDefinition[number] as TItem["code"]]: `${TProcessor}_${TItem["code"]}`;
} & {
    FAILED: `${TProcessor}_FAILED`;

    schemaList: [
        ...{
            [K in keyof TDefinition]: TDefinition[K] extends {
                code: infer TCode extends string;
                dataSchema: infer TDataSchema extends z.ZodType;
            }
                ? z.ZodObject<{
                      type: z.ZodLiteral<`${TProcessor}_${TCode}`>;
                      data: TDataSchema;
                  }>
                : never;
        },
        z.ZodObject<{
            type: z.ZodLiteral<`${TProcessor}_FAILED`>;
            error: typeof ErrorDetailSchema;
        }>,
    ];
};

/**
 * Defines a workflow event contract.
 *
 * FAILED is a built-in event with a standardized ErrorDetail payload.
 * Only successful event payload schemas are defined by the caller.
 */
export function defineEventContract<
    const TProcessor extends string,
    const TDefinition extends readonly [EventDefinition, ...EventDefinition[]],
>(
    processorName: TProcessor,
    definitionList: TDefinition,
): EventContract<TProcessor, TDefinition> {
    const successSchemaList = definitionList.map(({ code, dataSchema }) =>
        z.object({
            type: z.literal(`${processorName}_${code}`),
            data: dataSchema,
        }),
    );

    const failedSchema = z.object({
        type: z.literal(`${processorName}_FAILED`),
        error: ErrorDetailSchema,
    });

    const schemaList = [...successSchemaList, failedSchema] as EventContract<
        TProcessor,
        TDefinition
    >["schemaList"];

    const eventCodeMap = Object.fromEntries(
        definitionList.map(({ code }) => [code, `${processorName}_${code}`]),
    );

    return {
        ...eventCodeMap,
        FAILED: `${processorName}_FAILED`,
        schemaList,
    } as EventContract<TProcessor, TDefinition>;
}

export const GraphIntentCreatedEvent = defineEventContract(
    "GRAPH_INTENT_CREATED",
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.unknown(),
        },
    ],
);

export const GraphOperationResultEvent = defineEventContract(
    "GRAPH_OPERATION_RESULT",
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.unknown(),
        },
    ],
);
