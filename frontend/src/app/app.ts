import { Component, inject, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ApiService } from "./services/api.service";

@Component({
    imports: [RouterOutlet],
    selector: "app-root",
    styleUrl: "./app.scss",
    templateUrl: "./app.html",
})
export class App {
    private readonly api = inject(ApiService);

    protected readonly title = signal("frontend");
    protected readonly health = signal("尚未取得 API 資料");

    constructor() {
        this.api.getHealth().subscribe({
            next: (response) => {
                this.health.set(`${response.service}: ${response.status}`);
            },
            error: (error) => {
                console.error("API request failed:", error);
                this.health.set("API 連線失敗");
            },
        });
    }
}
