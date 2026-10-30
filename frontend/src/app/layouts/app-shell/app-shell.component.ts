import { Component, computed, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ButtonModule } from "@openng/optimus-ui/button";
import { TooltipModule } from "@openng/optimus-ui/tooltip";

import { AppHeaderComponent } from "#app/widgets/app-header";
import { SearchOverlayComponent } from "#app/widgets/search-overlay";

import {
    NavigationSidebarComponent,
    type NavigationSidebarMode,
} from "./ui/navigation-sidebar.component";

@Component({
    selector: "app-shell",
    standalone: true,
    imports: [
        RouterOutlet,
        NavigationSidebarComponent,
        ButtonModule,
        TooltipModule,
        AppHeaderComponent,
        SearchOverlayComponent,
    ],
    templateUrl: "./app-shell.component.html",
})
export class AppShellComponent {
    readonly sidebarMode = signal<NavigationSidebarMode>("pinned");
    readonly isSearchOpen = signal(false);

    readonly showSidebarTrigger = signal(false);

    readonly sidebarWidth = computed(() => {
        switch (this.sidebarMode()) {
            case "overlay":
            case "pinned":
                return "12rem";

            case "rail":
                return "4rem";

            case "hidden":
                return "0";
        }
    });

    protected toggleSidebar(): void {
        this.sidebarMode.update((mode) => {
            switch (mode) {
                case "pinned":
                    return "hidden";

                case "overlay":
                case "rail":
                case "hidden":
                    return "pinned";
            }
        });

        this.showSidebarTrigger.set(false);
    }

    protected openSearch(): void {
        this.isSearchOpen.set(true);
    }

    protected closeSearch(): void {
        this.isSearchOpen.set(false);
    }

    protected onSidebarModeChange(mode: NavigationSidebarMode): void {
        this.sidebarMode.set(mode);
        this.showSidebarTrigger.set(false);
    }

    protected onSidebarTriggerMouseEnter(): void {
        this.showSidebarTrigger.set(true);
    }

    protected onSidebarTriggerMouseLeave(): void {
        this.showSidebarTrigger.set(false);
    }
}
