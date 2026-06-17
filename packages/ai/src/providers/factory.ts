import { createOpenRouterProvider } from "./openrouter";
import type { Provider } from "./provider";
import type { ProviderConfig, ProviderType } from "./types";

export function createProvider(
  _type: ProviderType,
  config?: Omit<ProviderConfig, "type">,
): Provider {
  return createOpenRouterProvider({
    apiKey: config?.apiKey,
    baseUrl: config?.baseUrl,
    timeout: config?.timeout,
    maxRetries: config?.maxRetries,
    httpReferer: config?.httpReferer,
    xTitle: config?.xTitle,
    fetch: config?.fetch,
  });
}

export function createProviderFromConfig(
  config: ProviderConfig,
): Provider {
  const { type: _type, ...rest } = config;
  return createProvider(_type, rest);
}
