import { Component, computed, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ButtonModule } from "@openng/optimus-ui/button";
import { TooltipModule } from "@openng/optimus-ui/tooltip";

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
    ],
    templateUrl: "./app-shell.component.html",
})
export class AppShellComponent {
    readonly sidebarMode = signal<NavigationSidebarMode>("pinned");

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
