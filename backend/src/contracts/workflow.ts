import { z } from "zod";
import { ErrorDetailSchema } from "./error.js";

type EventDefinition = {
    code: string;
    dataSchema: z.ZodType;
};

type EventCodes<
    TProcessor extends string,
    TDefinitions extends readonly EventDefinition[],
> = {
    [TDefinition in TDefinitions[number] as TDefinition["code"]]: `${TProcessor}_${TDefinition["code"]}`;
} & {
    FAILED: `${TProcessor}_FAILED`;

    schemaList: [
        ...{
            [K in keyof TDefinitions]: TDefinitions[K] extends {
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
 * Creates workflow event codes and schemas.
 *
 * FAILED is a built-in event with a standardized ErrorDetail payload.
 * Only successful event payloads are defined by the caller.
 */
export function createEventCodes<
    const TProcessor extends string,
    const TDefinitions extends readonly [EventDefinition, ...EventDefinition[]],
>(
    processorName: TProcessor,
    definitionList: TDefinitions,
): EventCodes<TProcessor, TDefinitions> {
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

    const schemaList = [...successSchemaList, failedSchema] as EventCodes<
        TProcessor,
        TDefinitions
    >["schemaList"];

    const eventCodes = Object.fromEntries(
        definitionList.map(({ code }) => [code, `${processorName}_${code}`]),
    );

    return {
        ...eventCodes,
        FAILED: `${processorName}_FAILED`,
        schemaList,
    } as EventCodes<TProcessor, TDefinitions>;
}

export const GraphIntentCreatedEvents = createEventCodes(
    "GRAPH_INTENT_CREATED",
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.unknown(),
        },
    ],
);

export const GraphOperationResultEvents = createEventCodes(
    "GRAPH_OPERATION_RESULT",
    [
        {
            code: "SUCCEEDED",
            dataSchema: z.unknown(),
        },
    ],
);
