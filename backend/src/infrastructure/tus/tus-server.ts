import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";

import * as Paths from "#app/infrastructure/storage/paths.js";

export const tusServer = new Server({
    path: "/api/v1/tus/files",
    datastore: new FileStore({
        directory: Paths.TMP_TUS,
    }),
    relativeLocation: true,
});
