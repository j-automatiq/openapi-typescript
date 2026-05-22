import type { MediaType } from "openapi-typescript-helpers";
import createClient from "../src/index.js";

/**
 * Create a client instance where all requests use a custom fetch implementation.
 * This avoids:
 *  - Test implementation footguns
 *  - Shared state/leakage between tests (most mocking libraries including msw)
 *  - Any additional runtime, really—it only processes what you give it
 *
 * ⚠️ YOU MUST MOCK ALL RESPONSES!
 * If you have too much going on in one handler, just make another instance. These are cheap.
 */
// Note: this isn’t called “createMockedClient” because ✨ nothing is mocked 🌈! It’s only calling the handler you pass in.
export function createObservedClient<T extends {}, M extends MediaType = MediaType>(
  options?: Parameters<typeof createClient<T>>[0],
  onRequest: (input: Request) => Promise<Response> = async () => Response.json({ status: 200, message: "OK" }),
) {
  return createClient<T, M>({
    ...options,
    baseUrl: options?.baseUrl || "https://fake-api.example", // Node.js requires a domain for Request(). This restriction doesn’t exist in browsers, but we are using `e2e.test.ts` for that..
    fetch: (input) => onRequest(input),
  });
}

/**
 * Convert a Headers object to a plain object for easier comparison
 */
export function headersToObj(headers: Headers | Record<string, string>): Record<string, string> {
  // Headers is iterable at runtime in both TS 5 and TS 6, but the lib type only
  // declares Iterable in TS 6's lib.dom. Double-cast bridges the gap.
  const entries =
    headers instanceof Headers ? Array.from(headers as unknown as Iterable<[string, string]>) : Object.entries(headers);
  const result: Record<string, string> = {};
  for (const [k, v] of entries) {
    result[k] = v;
  }
  return result;
}
