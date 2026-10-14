import { computed, Injectable, signal } from "@angular/core";

@Injectable()
export class SelectionStore {
    private readonly writableSelectedIdSet = signal<Set<string>>(new Set());

    readonly selectedIdSet = this.writableSelectedIdSet.asReadonly();

    readonly selectedIdList = computed(() => [...this.selectedIdSet()]);

    readonly selectedCount = computed(() => this.selectedIdSet().size);

    readonly hasSelection = computed(() => this.selectedCount() > 0);

    readonly hasExactlyOneSelected = computed(() => this.selectedCount() === 1);

    readonly singleSelectedId = computed(() => {
        if (!this.hasExactlyOneSelected()) return null;

        return this.selectedIdSet().values().next().value ?? null;
    });

    isSelected(id: string): boolean {
        return this.selectedIdSet().has(id);
    }

    select(id: string): void {
        this.writableSelectedIdSet.update((current) => {
            if (current.has(id)) return current;

            const next = new Set(current);
            next.add(id);

            return next;
        });
    }

    deselect(id: string): void {
        this.writableSelectedIdSet.update((current) => {
            if (!current.has(id)) return current;

            const next = new Set(current);
            next.delete(id);

            return next;
        });
    }

    toggleSelect(id: string): void {
        this.writableSelectedIdSet.update((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    setSelected(idList: readonly string[]): void {
        this.writableSelectedIdSet.set(new Set(idList));
    }

    clearSelection(): void {
        this.writableSelectedIdSet.set(new Set());
    }
}
