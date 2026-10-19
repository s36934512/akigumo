import { Component, computed, input, output, signal } from "@angular/core";

import { getArchiveIconPath } from "../model/archive-icon";
import type { Archive } from "../model/types";

@Component({
    selector: "entity-archive-card",
    standalone: true,
    templateUrl: "./archive-card.component.html",
    styleUrl: "./archive-card.component.scss",
})
export class ArchiveCardComponent {
    readonly archive = input.required<Archive>();
    readonly selected = input(false);

    readonly cardClick = output<string>();

    readonly imageErrorFileId = signal<string | null>(null);

    readonly coverUrl = computed(() => {
        const fileId = this.archive().currentFileId;

        if (!fileId || this.imageErrorFileId() === fileId) {
            return null;
        }

        return `/api/v1/raw/${fileId}`;
    });

    readonly iconPath = computed(() => {
        return getArchiveIconPath(this.archive().type);
    });

    onClick(): void {
        this.cardClick.emit(this.archive().id);
    }

    onImageError(): void {
        const fileId = this.archive().currentFileId;

        if (fileId) {
            this.imageErrorFileId.set(fileId);
        }
    }
}
