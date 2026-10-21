import { Component, computed, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "@openng/optimus-ui/button";
import { DynamicDialogRef } from "@openng/optimus-ui/dynamicdialog";
import { InputTextModule } from "@openng/optimus-ui/inputtext";

import type { PostApiV1OntologyRegistryBody } from "#app/shared/api/model";

import { CreateConceptApi } from "../api/create-concept.api";
import { CreateConceptMutation } from "../api/create-concept.mutation";

@Component({
    selector: "feature-create-concept",
    standalone: true,
    imports: [FormsModule, ButtonModule, InputTextModule],
    providers: [CreateConceptApi, CreateConceptMutation],
    templateUrl: "./create-concept-dialog.component.html",
})
export class CreateConceptComponent {
    private readonly dialogRef = inject(DynamicDialogRef);

    readonly conceptName = signal("");

    readonly conceptDescription = signal("");

    readonly saved = output<void>();

    readonly createConceptMutation = inject(CreateConceptMutation);

    readonly isPending = computed(() =>
        this.createConceptMutation.create.isPending(),
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

        const input: PostApiV1OntologyRegistryBody["registryList"] = [
            {
                name,
                ...(description ? { description } : {}),
            },
        ];

        this.createConceptMutation.create.mutate(input, {
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
