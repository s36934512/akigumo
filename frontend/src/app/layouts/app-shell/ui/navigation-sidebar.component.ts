import { Component, computed, input, output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ButtonModule } from "@openng/optimus-ui/button";
import { MenuModule } from "@openng/optimus-ui/menu";
import { TooltipModule } from "@openng/optimus-ui/tooltip";

export type NavigationSidebarMode = "overlay" | "pinned" | "hidden" | "rail";

interface NavigationItem {
    label: string;
    route: string;
    icon: string;
}

@Component({
    selector: "app-shell-navigation-sidebar",
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive,
        ButtonModule,
        TooltipModule,
        MenuModule,
    ],
    templateUrl: "./navigation-sidebar.component.html",
})
export class NavigationSidebarComponent {
    readonly mode = input.required<NavigationSidebarMode>();

    readonly modeChange = output<NavigationSidebarMode>();

    readonly isExpanded = computed(
        () => this.mode() === "overlay" || this.mode() === "pinned",
    );

    protected readonly isPinned = computed(
        () => this.mode() === "pinned" || this.mode() === "rail",
    );

    readonly navigationItems: NavigationItem[] = [
        { label: "全部漫畫", route: "/explorer", icon: "dashboard" },
        { label: "標籤管理", route: "/ontology", icon: "tag" },
    ];

    toggleExpanded(): void {
        const transitions: Record<
            NavigationSidebarMode,
            NavigationSidebarMode
        > = {
            overlay: "hidden",
            pinned: "rail",
            hidden: "overlay",
            rail: "pinned",
        };

        this.modeChange.emit(transitions[this.mode()]);
    }

    togglePinned(): void {
        const transitions: Record<
            NavigationSidebarMode,
            NavigationSidebarMode
        > = {
            overlay: "pinned",
            pinned: "overlay",
            hidden: "rail",
            rail: "hidden",
        };

        this.modeChange.emit(transitions[this.mode()]);
    }
}
