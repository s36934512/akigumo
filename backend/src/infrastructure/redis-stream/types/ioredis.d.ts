import "ioredis";

declare module "ioredis" {
    interface Redis {
        xpending(
            stream: string,
            group: string,
            start: string,
            end: string,
            count: number,
        ): Promise<
            Array<
                [
                    id: string,
                    consumer: string,
                    time: number,
                    deliveryCount: number,
                ]
            >
        >;

        xautoclaim(
            stream: string,
            group: string,
            consumer: string,
            minIdleTime: number,
            start: string,
            ...args: Array<string | number>
        ): Promise<
            [
                nextCursor: string,
                messages: Array<[id: string, fields: string[]]>,
                deletedIds?: string[],
            ]
        >;

        xreadgroup(
            groupKeyword: "GROUP",
            group: string,
            consumer: string,
            ...args: Array<string | number>
        ): Promise<Array<
            [
                streamName: string,
                messages: Array<[id: string, fields: string[]]>,
            ]
        > | null>;
    }
}
