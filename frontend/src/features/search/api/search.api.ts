import { inject, Service } from "@angular/core";

import { DefaultService } from "#app/shared/api";

@Service()
export class SearchApi {
    private readonly api = inject(DefaultService);

    search(input: string) {
        return this.api.getApiV1Search({
            q: input.trim(),
            type: "all",
            limit: 20,
            offset: 0,
        });
    }
}
