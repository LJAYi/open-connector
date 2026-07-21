import type { ExecutionContext, ResolvedCredential } from "../../core/types.ts";

import { afterEach, describe, expect, it, vi } from "vitest";
import { credentialValidators, executors, gotifyActionHandlers, proxy } from "./executors.ts";

const baseUrl = "https://gotify.example.com";
const applicationToken = "application-token";

interface RecordedRequest {
  url: string;
  headers: Headers;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Gotify executors", () => {
  it("accepts a successful credential probe without version build fields", async () => {
    const requests: string[] = [];
    const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
      requests.push(String(input));
      return Response.json({});
    };

    const result = await credentialValidators.apiKey!({ apiKey: applicationToken, values: { baseUrl } }, { fetcher });

    expect(result).toMatchObject({
      profile: { displayName: "Gotify gotify.example.com" },
      metadata: { baseUrl, validationEndpoint: "/version" },
    });
    if (!result) throw new Error("expected credential validation result");
    expect(result.metadata).not.toHaveProperty("version");
    expect(requests).toEqual([`${baseUrl}/version`]);
  });

  it("keeps get_version response validation strict", async () => {
    const fetcher = async (): Promise<Response> => Response.json({ version: "2.7.3" });

    await expect(gotifyActionHandlers.get_version!({}, { applicationToken, baseUrl, fetcher })).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("commit must be a string"),
    });
  });

  it("blocks an unsafe self-hosted URL before credential validation fetch", async () => {
    const fetcher = vi.fn(async () => Response.json({}));

    await expect(
      credentialValidators.apiKey!(
        { apiKey: applicationToken, values: { baseUrl: "http://169.254.169.254/latest/meta-data" } },
        { fetcher },
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps the application token on same-origin redirects and strips it on cross-origin redirects", async () => {
    const requests = stubFetchSequence([
      new Response(null, { status: 307, headers: { location: `${baseUrl}/message/continue` } }),
      new Response(null, { status: 307, headers: { location: "https://elsewhere.example.com/message" } }),
      Response.json({ id: 1, appid: 2, message: "Hello", date: "2026-07-21T00:00:00Z" }),
    ]);

    await expect(executors["gotify.send_message"]!({ message: "Hello" }, executionContext())).resolves.toMatchObject({
      ok: true,
    });

    expect(requests.map((request) => request.url)).toEqual([
      `${baseUrl}/message`,
      `${baseUrl}/message/continue`,
      "https://elsewhere.example.com/message",
    ]);
    expect(requests[0]?.headers.get("x-gotify-key")).toBe(applicationToken);
    expect(requests[1]?.headers.get("x-gotify-key")).toBe(applicationToken);
    expect(requests[2]?.headers.has("x-gotify-key")).toBe(false);
  });

  it("strips the application token when proxy requests redirect across origins", async () => {
    const requests = stubFetchSequence([
      new Response(null, { status: 307, headers: { location: "https://elsewhere.example.com/messages" } }),
      Response.json({ messages: [] }),
    ]);

    await expect(proxy({ method: "GET", endpoint: "/messages" }, executionContext())).resolves.toMatchObject({
      ok: true,
    });

    expect(requests[0]?.headers.get("x-gotify-key")).toBe(applicationToken);
    expect(requests[1]?.headers.has("x-gotify-key")).toBe(false);
  });
});

function executionContext(): ExecutionContext {
  const credential: ResolvedCredential = {
    authType: "api_key",
    apiKey: applicationToken,
    values: { baseUrl },
    profile: { accountId: "gotify:test", displayName: "Gotify test", grantedScopes: [] },
    metadata: {},
  };
  return { getCredential: async () => credential };
}

function stubFetchSequence(responses: Response[]): RecordedRequest[] {
  const requests: RecordedRequest[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: input instanceof Request ? input.url : String(input),
      headers: new Headers(init?.headers),
    });
    const response = responses.shift();
    if (!response) throw new Error("unexpected extra request");
    return response;
  });
  return requests;
}
