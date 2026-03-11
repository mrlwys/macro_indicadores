import type { ExternalSourceAdapter } from "./base.js";

export class HttpJsonSourceAdapter implements ExternalSourceAdapter {
  constructor(
    public readonly name: string,
    private readonly config: {
      url: string;
      token?: string;
      headers?: Record<string, string>;
    },
  ) {}

  async fetch(): Promise<Record<string, unknown>> {
    const response = await fetch(this.config.url, {
      method: "GET",
      headers: {
        ...(this.config.headers ?? {}),
        ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`${this.name} source failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return payload;
  }
}
