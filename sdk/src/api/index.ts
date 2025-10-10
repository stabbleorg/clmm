import { ClmmConfigApi } from "./config";
import { PoolsApi } from "./pools";

export interface ClmmApiConfig {
  /** Base URL for the API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export class ClmmApi {
  public readonly pools: PoolsApi;
  public readonly clmmConfig: ClmmConfigApi;

  constructor(private readonly config: ClmmApiConfig) {
    this.pools = new PoolsApi(this.config);
    this.clmmConfig = new ClmmConfigApi(this.config);
  }
}
