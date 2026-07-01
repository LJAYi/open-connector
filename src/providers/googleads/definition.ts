import type { ProviderDefinition } from "../../core/types.ts";

import { googleAdsActions } from "./actions.ts";
import { googleAdsOAuthScopes } from "./scopes.ts";

const service = "googleads";

export const provider: ProviderDefinition = {
  service,
  displayName: "Google Ads",
  categories: ["Marketing", "Data"],
  authTypes: ["oauth2"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: googleAdsOAuthScopes,
      redirectPath: "/oauth/callback/googleads",
      tokenEndpointAuthMethod: "client_secret_post",
      authorizationParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  ],
  homepageUrl: "https://ads.google.com",
  actions: googleAdsActions,
};
