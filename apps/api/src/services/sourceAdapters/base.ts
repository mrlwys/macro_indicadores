export interface ExternalSourceAdapter {
  name: string;
  fetch: () => Promise<Record<string, unknown>>;
}
