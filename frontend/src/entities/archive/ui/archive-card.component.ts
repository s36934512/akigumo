import { Component, computed, input, signal } from "@angular/core";
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

    readonly coverUrl = computed(() => {
        const fileId = this.archive().currentFileId;

        return fileId ? `/api/v1/raw/${fileId}` : null;
    });

    readonly imageErrorFileId = signal<string | null>(null);

    readonly showCover = computed(() => {
        const fileId = this.archive().currentFileId;

        return fileId !== null && this.imageErrorFileId() !== fileId;
    });

    readonly gradientClass = computed(() => {
        switch (this.archive().type) {
            case "WORK":
                return "archive-card__gradient--work";
            case "SERIES":
                return "archive-card__gradient--series";
            case "COLLECTION":
                return "archive-card__gradient--collection";
            case "FILE_CONTAINER":
                return "archive-card__gradient--file";
        }
    });

    readonly iconPath = computed(() => {
        return getArchiveIconPath(this.archive().type);
    });

    readonly typeLabel = computed(() => {
        switch (this.archive().type) {
            case "WORK":
                return "Work";
            case "SERIES":
                return "Series";
            case "COLLECTION":
                return "Collection";
            case "FILE_CONTAINER":
                return "File";
        }
    });

    onImageError(): void {
        const fileId = this.archive().currentFileId;

        if (fileId) {
            this.imageErrorFileId.set(fileId);
        }
    }
}
