import { RateLimitError, ServerError, TimeoutError } from "./openrouter/errors";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class CapabilityError extends ProviderError {
  constructor(
    providerId: string,
    capability: string,
  ) {
    super(
      `Provider "${providerId}" does not support capability "${capability}"`,
      "capability_error",
    );
    this.name = "CapabilityError";
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(message: string) {
    super(message, "configuration_error");
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderNotFoundError extends ProviderError {
  constructor(providerType: string) {
    super(
      `Unknown provider type: "${providerType}". Available types: openrouter`,
      "provider_not_found",
    );
    this.name = "ProviderNotFoundError";
  }
}

export function mapProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }

  if (error instanceof Error) {
    const retryable =
      error instanceof RateLimitError ||
      error instanceof ServerError ||
      error instanceof TimeoutError;

    return new ProviderError(
      error.message,
      "unknown_provider_error",
      retryable,
    );
  }

  return new ProviderError(
    "Unknown provider error",
    "unknown_provider_error",
    false,
  );
}
