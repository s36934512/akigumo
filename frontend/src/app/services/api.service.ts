import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";

export interface HealthResponse {
    status: string;
    service: string;
}

@Injectable({
    providedIn: "root",
})
export class ApiService {
    private readonly http = inject(HttpClient);

    getHealth(): Observable<HealthResponse> {
        return this.http.get<HealthResponse>("/api/health");
    }
}
