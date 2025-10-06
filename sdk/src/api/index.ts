import { PoolsApi } from "./pools";

export interface ClmmApiConfig {
  /** Base URL for the API */
  baseUrl: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export class ClmmApi {
  public readonly pools: PoolsApi;

  constructor(private readonly config: ClmmApiConfig) {
    this.pools = new PoolsApi(this.config);
  }
}
