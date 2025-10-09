import { ClmmConfig } from "../types";
import { ClmmApiConfig } from ".";
export declare class ClmmConfigApi {
    private readonly config;
    private readonly client;
    constructor(config: ClmmApiConfig);
    /**
     * Fetch all configs
     * @returns CLMM config information or null if not found
     */
    getClmmConfigs(): Promise<ClmmConfig[] | null>;
    /**
     * Handle API errors and convert to Error
     * @param error - Error from axios
     * @returns Error with appropriate message
     */
    private handleApiError;
    /**
     * Check if error is a 404 Not Found
     * @param error - Error to check
     * @returns True if 404 error
     */
    private isNotFoundError;
}
//# sourceMappingURL=config.d.ts.map