export interface LoggerOptions {
  selendrascan: string;
}

export interface ScanerConfig {
  name: string;
  enabled: boolean;
  crawler: string;
  apiCustomTypes?: string;
  startDelay?: number;
  mode?: string;
  chunkSize?: number;
  statsPrecision?: number;
  pollingTime?: number;
  historySize?: number;
  erasPerDay?: number;
  tokenDecimals?: number;
  featuredTimespan?: number;
}