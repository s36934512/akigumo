import { Injectable, signal } from "@angular/core";

@Injectable()
export class ArchiveConceptStore {
    readonly searchKeyword = signal("");

    setSearchKeyword(keyword: string): void {
        this.searchKeyword.set(keyword);
    }

    clearSearchKeyword(): void {
        this.searchKeyword.set("");
    }
}
