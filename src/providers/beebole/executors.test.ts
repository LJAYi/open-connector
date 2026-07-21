import { describe, expect, it } from "vitest";
import { beeboleActionHandlers, credentialValidators } from "./executors.ts";

const graphqlErrors = [
  {
    message: "Unknown project",
    locations: [{ line: 1, column: 3 }],
    path: ["project"],
    extensions: { code: "NOT_FOUND" },
  },
];

describe("Beebole executors", () => {
  it("returns GraphQL errors from a successful action request", async () => {
    const fetcher = async (): Promise<Response> => Response.json({ data: { project: null }, errors: graphqlErrors });

    await expect(
      beeboleActionHandlers.execute_graphql!(
        { query: "query Project { project { id } }" },
        { apiKey: "beebole-key", fetcher },
      ),
    ).resolves.toEqual({ data: { project: null }, errors: graphqlErrors });
  });

  it("rejects credentials when the validation response contains GraphQL errors", async () => {
    const fetcher = async (): Promise<Response> => Response.json({ data: null, errors: graphqlErrors });

    await expect(
      credentialValidators.apiKey!({ apiKey: "beebole-key", values: {} }, { fetcher }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Unknown project",
    });
  });
});
