import { Component, computed, inject, input } from "@angular/core";
import { MessageService } from "@openng/optimus-ui/api";
import { ButtonModule } from "@openng/optimus-ui/button";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";

import type { DeleteApiV1OntologyBody } from "#app/shared/api/model";

import { ConceptDeleteApi } from "../api/concept-delete.api";
import { ConceptDeleteMutation } from "../api/concept-delete.mutation";

@Component({
    selector: "feature-concept-delete",
    standalone: true,
    imports: [ButtonModule],
    providers: [ConceptDeleteApi, ConceptDeleteMutation],
    templateUrl: "./concept-delete-dialog.component.html",
})
export class ConceptDeleteDialogComponent {
    private readonly dialogRef = inject(DynamicDialogRef);
    private readonly messageService = inject(MessageService);

    readonly conceptIdList = input.required<string[]>();

    readonly conceptDeleteMutation = inject(ConceptDeleteMutation);

    readonly isPending = computed(() =>
        this.conceptDeleteMutation.delete.isPending(),
    );

    readonly canSubmit = computed(
        () => this.conceptIdList().length > 0 && !this.isPending(),
    );

    protected onCancel(): void {
        this.dialogRef.close();
    }

    protected onConfirm(): void {
        if (!this.canSubmit()) {
            return;
        }

        const input: DeleteApiV1OntologyBody = {
            idList: this.conceptIdList(),
        };

        this.conceptDeleteMutation.delete.mutate(input, {
            onSuccess: () => {
                this.messageService.add({
                    severity: "success",
                    summary: "刪除成功",
                    detail: `已送出 ${input.idList.length} 筆資料的刪除操作。`,
                });

                this.dialogRef.close({ submitted: true });
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
