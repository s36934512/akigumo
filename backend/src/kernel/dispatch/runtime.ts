import { logger } from "#app/infrastructure/logger/index.js";

type Dispatch = () => Promise<void>;

export function createDispatchRuntime(dispatch: Dispatch) {
    let dispatchRunning = false;
    let dispatchRequested = false;

    const requestDispatch = (): void => {
        dispatchRequested = true;

        if (dispatchRunning) {
            return;
        }

        void runDispatch();
    };

    async function runDispatch(): Promise<void> {
        if (dispatchRunning) {
            return;
        }

        dispatchRunning = true;

        try {
            do {
                dispatchRequested = false;

                await dispatch();
            } while (dispatchRequested);
        } catch (error: unknown) {
            logger.error({ error }, "處理待辦任務失敗");
        } finally {
            dispatchRunning = false;
        }
    }

    return {
        requestDispatch,
    };
}
