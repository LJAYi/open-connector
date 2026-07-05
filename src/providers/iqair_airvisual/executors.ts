import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";

import { defineApiKeyProviderExecutors } from "../provider-runtime.ts";
import { iqairAirvisualActionHandlers, validateIqairAirvisualCredential } from "./runtime.ts";

const service = "iqair_airvisual";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, iqairAirvisualActionHandlers);

export const credentialValidators: CredentialValidators = {
  apiKey: validateIqairAirvisualCredential,
};
