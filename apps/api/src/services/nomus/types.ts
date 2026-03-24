export const NOMUS_SUPPORTED_ENDPOINTS = ["propostas", "pedidos", "contasReceber", "processos", "ordens"] as const;

export type NomusEndpoint = (typeof NOMUS_SUPPORTED_ENDPOINTS)[number];

export type NomusSyncEndpointResult = {
  endpoint: NomusEndpoint;
  strategy: "last_max_id_with_page_lookback";
  recordsFetched: number;
  pagesFetched: number;
  lookbackRecordsFetched: number;
  lookbackNewRecordsFetched: number;
  lookbackPagesFetched: number;
  incrementalRecordsFetched: number;
  incrementalPagesFetched: number;
  lastMaxIdBefore: number;
  lastMaxIdAfter: number;
};

export type NomusSyncRunResult = {
  endpointsTried: NomusEndpoint[];
  endpointsSucceeded: NomusEndpoint[];
  endpointResults: NomusSyncEndpointResult[];
  errors: string[];
};
