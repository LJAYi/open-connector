import type { ActionDefinition, JsonSchema } from "../../core/types.ts";

import { defineProviderAction } from "../../core/provider-definition.ts";
import { griptapeGeneratedActionSchemas } from "./generated.ts";

const service = "griptape";

export type GriptapeActionName = (typeof griptapeGeneratedActionSchemas)[number]["name"];

export const griptapeActions: ActionDefinition[] = griptapeGeneratedActionSchemas.map((actionSchema) =>
  defineProviderAction(service, {
    name: actionSchema.name,
    description: actionSchema.description,
    requiredScopes: actionSchema.requiredScopes,
    providerPermissions: actionSchema.providerPermissions,
    inputSchema: actionSchema.inputSchema as JsonSchema,
    outputSchema: actionSchema.outputSchema as JsonSchema,
  }),
);
