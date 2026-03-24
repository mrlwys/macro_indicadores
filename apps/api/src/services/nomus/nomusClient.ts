import { env } from "../../config/env.js";
import type { NomusEndpoint } from "./types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt: number): number {
  const base = env.NOMUS_BACKOFF_BASE_MS;
  const max = env.NOMUS_BACKOFF_MAX_MS;
  const raw = base * 2 ** attempt;
  return Math.min(raw, max);
}

function parseThrottleWaitMs(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeSeconds = (payload as { tempoAteLiberar?: unknown }).tempoAteLiberar;
  if (typeof maybeSeconds !== "number") {
    return null;
  }

  return Math.min(maybeSeconds * 1000, env.NOMUS_THROTTLE_MAX_WAIT_MS);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toErrorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const description = (payload as { descricao?: unknown }).descricao;
    if (typeof description === "string" && description.trim()) {
      return `HTTP ${status} - ${description}`;
    }

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return `HTTP ${status} - ${message}`;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return `HTTP ${status} - ${payload.slice(0, 180)}`;
  }

  return `HTTP ${status}`;
}

export class NomusClient {
  async listEndpoint(params: {
    endpoint: NomusEndpoint;
    page: number;
    query?: string;
  }): Promise<unknown[]> {
    const url = new URL(`${env.NOMUS_BASE_URL.replace(/\/$/, "")}/${params.endpoint}`);
    url.searchParams.set("pagina", String(params.page));
    if (params.query) {
      url.searchParams.set("query", params.query);
    }

    for (let attempt = 0; attempt <= env.NOMUS_MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.NOMUS_TIMEOUT_MS);

      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${env.NOMUS_INTEGRATION_KEY ?? ""}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const payload = await parseResponseBody(response);

        if (response.status === 429) {
          if (attempt >= env.NOMUS_MAX_RETRIES) {
            throw new Error("Nomus throttling: limite de tentativas excedido.");
          }

          const waitMs = parseThrottleWaitMs(payload) ?? computeBackoff(attempt);
          await sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          if (response.status >= 500 && attempt < env.NOMUS_MAX_RETRIES) {
            await sleep(computeBackoff(attempt));
            continue;
          }

          throw new Error(`Nomus request failed: ${toErrorMessage(response.status, payload)}`);
        }

        if (!Array.isArray(payload)) {
          throw new Error(`Nomus returned non-array payload for endpoint ${params.endpoint}.`);
        }

        return payload;
      } catch (error) {
        clearTimeout(timeout);

        const isAbort = error instanceof Error && error.name === "AbortError";
        if (attempt >= env.NOMUS_MAX_RETRIES) {
          throw error;
        }

        if (isAbort || error instanceof TypeError) {
          await sleep(computeBackoff(attempt));
          continue;
        }

        if (error instanceof Error && error.message.includes("Nomus request failed")) {
          throw error;
        }

        await sleep(computeBackoff(attempt));
      }
    }

    throw new Error(`Falha ao consultar endpoint ${params.endpoint}.`);
  }
}
