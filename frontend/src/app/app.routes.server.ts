import { RenderMode, type ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
    {
        path: "archive/:archiveId",
        renderMode: RenderMode.Client,
    },
    {
        path: "**",
        renderMode: RenderMode.Prerender,
    },
];
