/**
 * 用於標記 processor 執行期間不需要重試的致命錯誤。
 *
 * payload 可攜帶 processor 提供的額外錯誤資料。
 */
export class NonRetryableError extends Error {
    constructor(
        message: string,
        public readonly payload?: unknown,
    ) {
        super(message);
        this.name = "NonRetryableError";
    }
}
