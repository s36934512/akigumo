import type { Routes } from "@angular/router";

export const routes: Routes = [
    { path: "", redirectTo: "explorer", pathMatch: "full" },
    {
        path: "explorer",
        loadComponent: () =>
            import("#app/pages/explorer").then((m) => m.ExplorerPage),
    },
];
