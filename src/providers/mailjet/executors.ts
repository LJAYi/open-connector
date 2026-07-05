import type {
  CredentialValidationResult,
  CredentialValidators,
  ExecutionContext,
  ProviderExecutors,
} from "../../core/types.ts";
import type { MailjetContext } from "./runtime.ts";

import { optionalString, requiredString } from "../../core/cast.ts";
import { defineProviderExecutors, ProviderRequestError, requireApiKeyCredential } from "../provider-runtime.ts";
import { mailjetActionHandlers, validateMailjetCredential } from "./runtime.ts";

const service = "mailjet";

export const executors: ProviderExecutors = defineProviderExecutors<MailjetContext>({
  service,
  handlers: mailjetActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch): Promise<MailjetContext> {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      apiSecret: readStoredApiSecret(credential.values, credential.metadata),
      fetcher,
      signal: context.signal,
    };
  },
});

export const credentialValidators: CredentialValidators = {
  apiKey(input, { fetcher, signal }): Promise<CredentialValidationResult> {
    return validateMailjetCredential(input.apiKey, requireMailjetApiSecret(input.values), fetcher, signal);
  },
};

function requireMailjetApiSecret(values: Record<string, string>): string {
  return requiredString(values.apiSecret, "apiSecret", (message) => new ProviderRequestError(400, message));
}

function readStoredApiSecret(values: Record<string, string>, metadata: Record<string, unknown>): string {
  const apiSecret = optionalString(values.apiSecret) ?? optionalString(metadata.apiSecret);
  if (!apiSecret) {
    throw new ProviderRequestError(500, "Stored apiSecret is missing for Mailjet");
  }
  return apiSecret;
}
