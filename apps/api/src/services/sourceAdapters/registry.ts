import { HttpJsonSourceAdapter } from "./httpJsonSource.js";
import type { ExternalSourceAdapter } from "./base.js";

export function buildSourceAdapters(): ExternalSourceAdapter[] {
  const adapters: ExternalSourceAdapter[] = [];

  if (process.env.SOURCE_A_BASE_URL) {
    adapters.push(
      new HttpJsonSourceAdapter("source_a", {
        url: process.env.SOURCE_A_BASE_URL,
        token: process.env.SOURCE_A_API_KEY,
      }),
    );
  }

  if (process.env.SOURCE_B_BASE_URL) {
    adapters.push(
      new HttpJsonSourceAdapter("source_b", {
        url: process.env.SOURCE_B_BASE_URL,
        token: process.env.SOURCE_B_API_KEY,
      }),
    );
  }

  return adapters;
}
