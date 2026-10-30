import { Component, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Button } from "@openng/optimus-ui/button";

@Component({
    selector: "widget-app-header",
    standalone: true,
    imports: [RouterLink, Button],
    templateUrl: "./app-header.component.html",
})
export class AppHeaderComponent {
    readonly sidebarToggle = output<void>();
    readonly searchOpen = output<void>();
}
