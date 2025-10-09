import { ClmmConfigApi } from "./config";
import { PoolsApi } from "./pools";
export interface ClmmApiConfig {
    /** Base URL for the API */
    baseUrl: string;
    /** Request timeout in milliseconds */
    timeout?: number;
}
export declare class ClmmApi {
    private readonly config;
    readonly pools: PoolsApi;
    readonly clmmConfig: ClmmConfigApi;
    constructor(config: ClmmApiConfig);
}
//# sourceMappingURL=index.d.ts.map