import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";

export const tusServer = new Server({
    path: "/api/v1/tus/files",
    datastore: new FileStore({
        directory: "/tmp/akigumo-tus",
    }),
});
