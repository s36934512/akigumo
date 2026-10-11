import { createMachine } from "xstate";

/**
 * Overlay 狀態機邏輯：
 * - closed: 初始狀態，等待滑鼠進入。
 * - opened: 彈窗開啟狀態。
 *   - opened.idle: 滑鼠在合法區域內。
 *   - opened.pendingClose: 滑鼠離開合法區域，進入倒數。
 *     - 如果在倒數結束前再次進入，回到 idle 並自動取消倒數。
 *     - 如果倒數結束，回到外部的 closed 狀態。
 */
export const createOverlayMachine = (callbacks: {
    onOpen: () => void;
    onClose: () => void;
}) => {
    return createMachine({
        id: "overlay",
        initial: "closed",

        states: {
            closed: {
                on: {
                    MOUSE_ENTER: {
                        target: "waiting",
                    },
                },
            },

            waiting: {
                after: {
                    800: { target: "opened" },
                },

                on: {
                    FORCE_CLOSE: { target: "closed" },
                    MOUSE_LEAVE: { target: "closed" },
                },
            },

            opened: {
                entry: () => callbacks.onOpen(),
                exit: () => callbacks.onClose(),

                initial: "idle",

                on: {
                    FORCE_CLOSE: { target: "closed" },
                },

                states: {
                    idle: {
                        on: {
                            MOUSE_LEAVE: { target: "pendingClose" },
                        },
                    },

                    pendingClose: {
                        after: {
                            200: { target: "#overlay.closed" },
                        },

                        on: {
                            MOUSE_ENTER: { target: "idle" },
                        },
                    },
                },
            },
        },
    });
};
