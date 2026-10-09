import { logger } from "#app/infrastructure/logger/index.js";

type Dispatch = () => Promise<void>;

interface DispatchRuntimeConfig {
    pollIntervalMs: number;
}

export function createDispatchRuntime(
    dispatch: Dispatch,
    config: DispatchRuntimeConfig,
) {
    let stopped = true;
    let dispatchRequested = false;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let runningPromise: Promise<void> | undefined;

    function requestDispatch(): void {
        if (stopped) {
            return;
        }

        dispatchRequested = true;

        if (runningPromise) {
            return;
        }

        runningPromise = runDispatch();
    }

    async function runDispatch(): Promise<void> {
        try {
            while (dispatchRequested && !stopped) {
                dispatchRequested = false;

                try {
                    await dispatch();
                } catch (error) {
                    logger.error({ err: error }, "處理待辦任務失敗");
                }
            }
        } finally {
            runningPromise = undefined;

            if (dispatchRequested && !stopped) {
                requestDispatch();
            }
        }
    }

    function schedulePoll(): void {
        if (stopped) {
            return;
        }

        timer = setTimeout(() => {
            timer = undefined;

            requestDispatch();
            schedulePoll();
        }, config.pollIntervalMs);
    }

    function start(): void {
        if (!stopped) {
            return;
        }

        stopped = false;

        requestDispatch();
        schedulePoll();
    }

    async function stop(): Promise<void> {
        stopped = true;
        dispatchRequested = false;

        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }

        await runningPromise;
    }

    return {
        start,
        stop,
        requestDispatch,
    };
}
