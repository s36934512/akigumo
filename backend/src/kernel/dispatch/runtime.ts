import { logger } from "#app/infrastructure/logger/index.js";

type Dispatch = () => Promise<void>;

interface DispatchRuntimeConfig {
    pollIntervalMs: number;
}

export function createDispatchRuntime(
    dispatch: Dispatch,
    config: DispatchRuntimeConfig,
) {
    let dispatchRunning = false;
    let dispatchRequested = false;
    let stopped = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const requestDispatch = (): void => {
        dispatchRequested = true;

        if (dispatchRunning || stopped) {
            return;
        }

        void runDispatch();
    };

    async function runDispatch(): Promise<void> {
        if (dispatchRunning || stopped) {
            return;
        }

        dispatchRunning = true;

        try {
            do {
                dispatchRequested = false;

                await dispatch();
            } while (dispatchRequested && !stopped);
        } catch (error) {
            logger.error({ err: error }, "處理待辦任務失敗");
        } finally {
            dispatchRunning = false;
        }
    }

    function schedulePoll(): void {
        if (stopped) {
            return;
        }

        timer = setTimeout(() => {
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

        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }

        while (dispatchRunning) {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 10);
            });
        }
    }

    return {
        start,
        stop,
        requestDispatch,
    };
}
