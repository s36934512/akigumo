export interface DispatchTrigger {
    start(requestDispatch: () => void): Promise<void>;
    stop(): Promise<void>;
}
