import { createAuthClient } from "better-auth/client";

export function createClient(): ReturnType<typeof createAuthClient> {
  return createAuthClient({});
}
