import { Component, computed, inject, input } from "@angular/core";
import { MessageService } from "@openng/optimus-ui/api";
import { ButtonModule } from "@openng/optimus-ui/button";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";

import type {
    PostApiV1ArchiveDeleteBody,
    PostApiV1ArchiveDeleteBodyItem,
} from "#app/shared/api/model";

import { ArchiveDeleteApi } from "../api/archive-delete.api";
import { ArchiveDeleteMutation } from "../api/archive-delete.mutation";

@Component({
    selector: "feature-archive-delete",
    standalone: true,
    imports: [ButtonModule],
    providers: [ArchiveDeleteApi, ArchiveDeleteMutation],
    templateUrl: "./archive-delete-dialog.component.html",
})
export class ArchiveDeleteDialogComponent {
    private readonly dialogRef = inject(DynamicDialogRef);
    private readonly messageService = inject(MessageService);

    readonly archiveIdList = input.required<string[]>();

    readonly archiveDeleteMutation = inject(ArchiveDeleteMutation);

    readonly isPending = computed(() =>
        this.archiveDeleteMutation.delete.isPending(),
    );

    readonly canSubmit = computed(
        () => this.archiveIdList().length > 0 && !this.isPending(),
    );

    protected onCancel(): void {
        this.dialogRef.close();
    }

    protected onConfirm(): void {
        if (!this.canSubmit()) {
            return;
        }

        const input: PostApiV1ArchiveDeleteBody = {
            archiveIdList: this.archiveIdList().map((id) => id),
        };

        this.archiveDeleteMutation.delete.mutate(input, {
            onSuccess: () => {
                this.messageService.add({
                    severity: "success",
                    summary: "刪除成功",
                    detail: `已送出 ${input.archiveIdList.length} 筆資料的刪除操作。`,
                });

                this.dialogRef.close({ deleted: true });
            },
            onError: () => {
                this.messageService.add({
                    severity: "error",
                    summary: "刪除失敗",
                    detail: "無法刪除資料，請稍後再試。",
                });
            },
        });
    }
}
