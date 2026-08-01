// Minimal request/response shape shared by every /api handler. Deliberately
// NOT importing @vercel/node's types here — its `import type` would still
// need the package installed for local `tsc`, and that package drags in a
// dev-tooling dependency tree with several high/critical CVEs (tar, undici,
// path-to-regexp) that never actually ship to the deployed function. Vercel's
// real runtime request/response objects are structurally compatible with
// this interface, and so is Express (used by dev-server.ts for local runs).
export interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(data?: unknown): void;
  setHeader(name: string, value: string): void;
}
