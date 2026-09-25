import { handleArchiveServe } from "./api/handler.js";

export const capability = {
    routes: [handleArchiveServe],
};
