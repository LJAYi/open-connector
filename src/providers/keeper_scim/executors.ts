import type { CredentialValidators, ExecutionContext, ProviderExecutors } from "../../core/types.ts";

import { defineProviderExecutors, requireApiKeyCredential } from "../provider-runtime.ts";
import { keeperScimActionHandlers, resolveKeeperScimConfig, validateKeeperScimCredential } from "./runtime.ts";

const service = "keeper_scim";

export const executors: ProviderExecutors = defineProviderExecutors({
  service,
  handlers: keeperScimActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch) {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      config: resolveKeeperScimConfig({
        providerMetadata: credential.metadata,
        values: credential.values,
      }),
      fetcher,
      signal: context.signal,
    };
  },
});

export const credentialValidators: CredentialValidators = {
  apiKey: validateKeeperScimCredential,
};
