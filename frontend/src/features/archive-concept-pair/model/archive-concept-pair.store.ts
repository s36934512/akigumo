import { Injectable, signal } from "@angular/core";

@Injectable()
export class ArchiveConceptPairStore {
    readonly statementSearchKeyword = signal("");
    readonly valueSearchKeyword = signal("");

    setStatementSearchKeyword(keyword: string): void {
        this.statementSearchKeyword.set(keyword);
    }

    setValueSearchKeyword(keyword: string): void {
        this.valueSearchKeyword.set(keyword);
    }

    clearSearchKeywords(): void {
        this.statementSearchKeyword.set("");
        this.valueSearchKeyword.set("");
    }
}
