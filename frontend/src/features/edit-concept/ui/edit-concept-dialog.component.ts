import {
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "@openng/optimus-ui/button";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";
import { InputTextModule } from "@openng/optimus-ui/inputtext";

import type { Concept } from "#app/entities/concept";
import type { PostApiV1OntologyEditorBody } from "#app/shared/api/model";

import { EditConceptApi } from "../api/edit-concept.api";
import { EditConceptMutation } from "../api/edit-concept.mutation";

@Component({
    selector: "feature-edit-concept",
    standalone: true,
    imports: [FormsModule, ButtonModule, InputTextModule],
    providers: [EditConceptApi, EditConceptMutation],
    templateUrl: "./edit-concept-dialog.component.html",
})
export class EditConceptComponent {
    private readonly dialogRef = inject(DynamicDialogRef);

    readonly concept = input.required<Concept>();

    readonly conceptName = linkedSignal(() => this.concept().name);

    readonly conceptDescription = linkedSignal(
        () => this.concept().description ?? "",
    );

    readonly saved = output<void>();

    readonly editConceptMutation = inject(EditConceptMutation);

    readonly isPending = computed(() =>
        this.editConceptMutation.edit.isPending(),
    );

    readonly canSubmit = computed(() => {
        return this.conceptName().trim().length > 0 && !this.isPending();
    });

    submit(): void {
        const name = this.conceptName().trim();
        const description = this.conceptDescription().trim();

        if (!this.canSubmit()) {
            return;
        }

        const input: PostApiV1OntologyEditorBody["registryList"] = [
            {
                id: this.concept().id,
                registry: {
                    name,
                    description,
                },
            },
        ];

        this.editConceptMutation.edit.mutate(input, {
            onSuccess: () => {
                this.dialogRef.close();
                this.saved.emit();
            },
        });
    }

    protected onCancel(): void {
        this.dialogRef.close();
    }
}
