import type { CredentialValidators, ExecutionContext, ProviderExecutors } from "../../core/types.ts";

import { optionalString } from "../../core/cast.ts";
import { defineProviderExecutors, requireApiKeyCredential } from "../provider-runtime.ts";
import { itGlueActionHandlers, resolveItGlueApiBaseUrl, validateItGlueCredential } from "./runtime.ts";

const service = "it_glue";

export const executors: ProviderExecutors = defineProviderExecutors({
  service,
  handlers: itGlueActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch) {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      apiBaseUrl: resolveItGlueApiBaseUrl(
        optionalString(credential.values.region) ?? optionalString(credential.metadata.region),
      ),
      fetcher,
      signal: context.signal,
    };
  },
});

export const credentialValidators: CredentialValidators = {
  apiKey: validateItGlueCredential,
};
