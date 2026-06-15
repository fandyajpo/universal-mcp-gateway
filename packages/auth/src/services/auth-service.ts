import type { AuthServer } from "../auth-server";
import { createCacheClient, RateLimiter } from "@repo/cache";
import { createLogger } from "@repo/logger";
import type { LoginInput, RegisterInput, ResetPasswordInput, VerifyEmailInput } from "@repo/validation";
import { loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "@repo/validation";

const logger = createLogger("@repo/auth:service");

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW = 900;
const REGISTER_RATE_LIMIT = 3;
const REGISTER_RATE_WINDOW = 3600;
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_COOLDOWN = 1800;

export interface AuthServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  retryAfter?: number;
}

export interface RegisterResult {
  userId: string;
  email: string;
  verificationSent: boolean;
}

export interface LoginResult {
  userId: string;
  email: string;
  name: string;
  sessionToken: string;
}

export interface VerifyEmailResult {
  verified: boolean;
}

export interface ForgotPasswordResult {
  emailSent: boolean;
}

export interface ResetPasswordResult {
  success: boolean;
}

export interface AuthServiceMethods {
  register(input: RegisterInput, ip?: string): Promise<AuthServiceResult<RegisterResult>>;
  login(input: LoginInput, ip?: string): Promise<AuthServiceResult<LoginResult>>;
  logout(sessionToken: string): Promise<AuthServiceResult<void>>;
  verifyEmail(input: VerifyEmailInput): Promise<AuthServiceResult<VerifyEmailResult>>;
  resendVerification(email: string): Promise<AuthServiceResult<void>>;
  forgotPassword(email: string): Promise<AuthServiceResult<ForgotPasswordResult>>;
  resetPassword(input: ResetPasswordInput): Promise<AuthServiceResult<ResetPasswordResult>>;
}

export function createAuthService(auth: AuthServer): AuthServiceMethods {
  const cache = createCacheClient();
  const rateLimiter = new RateLimiter(cache);

  function loginAttemptsKey(email: string): string {
    return `lockout:attempts:${email.toLowerCase()}`;
  }

  function loginCooldownKey(email: string): string {
    return `lockout:cooldown:${email.toLowerCase()}`;
  }

  function loginRateKey(email: string): string {
    return `ratelimit:login:${email.toLowerCase()}`;
  }

  function registerRateKey(ip: string): string {
    return `ratelimit:register:${ip}`;
  }

  async function checkAccountLockout(email: string): Promise<AuthServiceResult<never> | null> {
    const cooldownKey = loginCooldownKey(email);
    const cooldownTtl = await cache.ttl(cooldownKey);
    if (cooldownTtl > 0) {
      logger.warn({ email }, "account locked due to too many failed attempts");
      return {
        success: false,
        error: "Account is temporarily locked. Please try again later.",
        code: "ACCOUNT_LOCKED",
        retryAfter: cooldownTtl,
      };
    }
    return null;
  }

  async function recordFailedAttempt(email: string): Promise<void> {
    const key = loginAttemptsKey(email);
    const attemptCount = await cache.incr(key);
    if (attemptCount === 1) {
      await cache.expire(key, LOCKOUT_COOLDOWN);
    }
    if (attemptCount >= LOCKOUT_THRESHOLD) {
      const cooldownKey = loginCooldownKey(email);
      await cache.set(cooldownKey, "1", { ex: LOCKOUT_COOLDOWN });
      logger.warn({ email, attempts: attemptCount }, "account locked after too many failed attempts");
    }
  }

  async function resetFailedAttempts(email: string): Promise<void> {
    await cache.del(loginAttemptsKey(email));
    await cache.del(loginCooldownKey(email));
  }

  async function register(input: RegisterInput, ip?: string): Promise<AuthServiceResult<RegisterResult>> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.flatten() }, "registration validation failed");
      return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" };
    }

    if (ip) {
      let rateResult: { allowed: boolean; remaining: number; resetAt: number };
      try {
        rateResult = await rateLimiter.check(registerRateKey(ip), REGISTER_RATE_LIMIT, REGISTER_RATE_WINDOW);
      } catch (rateError) {
        logger.warn({ error: rateError, ip }, "register rate limiter failed, allowing request");
        rateResult = { allowed: true, remaining: 1, resetAt: Date.now() };
      }
      if (!rateResult.allowed) {
        logger.warn({ ip }, "registration rate limit exceeded");
        return {
          success: false,
          error: "Too many registration attempts. Please try again later.",
          code: "RATE_LIMITED",
          retryAfter: Math.ceil((rateResult.resetAt - Date.now()) / 1000),
        };
      }
    }

    try {
      const response = await auth.api.signUpEmail({
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        },
      });

      const result: RegisterResult = {
        userId: response.user.id,
        email: response.user.email,
        verificationSent: true,
      };

      logger.info({ userId: response.user.id, email: parsed.data.email }, "user registered");
      return { success: true, data: result };
    } catch (error) {
      logger.error({ error }, "registration failed");
      const message = error instanceof Error ? error.message : "Registration failed";
      if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("duplicate")) {
        return { success: false, error: "An account with this email already exists.", code: "EMAIL_EXISTS" };
      }
      return { success: false, error: "Registration failed. Please try again.", code: "REGISTRATION_FAILED" };
    }
  }

  async function login(input: LoginInput, _ip?: string): Promise<AuthServiceResult<LoginResult>> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.flatten() }, "login validation failed");
      return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" };
    }

    const lockoutCheck = await checkAccountLockout(parsed.data.email);
    if (lockoutCheck) return lockoutCheck;

    let rateResult: { allowed: boolean; remaining: number; resetAt: number };
    try {
      rateResult = await rateLimiter.check(loginRateKey(parsed.data.email), LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW);
    } catch (rateError) {
      logger.warn({ error: rateError, email: parsed.data.email }, "login rate limiter failed, allowing request");
      rateResult = { allowed: true, remaining: 1, resetAt: Date.now() };
    }
    if (!rateResult.allowed) {
      logger.warn({ email: parsed.data.email }, "login rate limit exceeded");
      return {
        success: false,
        error: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((rateResult.resetAt - Date.now()) / 1000),
      };
    }

    try {
      const response = await auth.api.signInEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          rememberMe: parsed.data.rememberMe,
        },
      });

      await resetFailedAttempts(parsed.data.email);

      const result: LoginResult = {
        userId: response.user.id,
        email: response.user.email,
        name: response.user.name,
        sessionToken: response.token,
      };

      logger.info({ userId: response.user.id }, "user logged in");
      return { success: true, data: result };
    } catch (error) {
      await recordFailedAttempt(parsed.data.email);
      logger.error({ error, email: parsed.data.email }, "login failed");
      const message = error instanceof Error ? error.message : "Login failed";
      if (message.toLowerCase().includes("email not verified")) {
        return { success: false, error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" };
      }
      return { success: false, error: "Invalid email or password.", code: "INVALID_CREDENTIALS" };
    }
  }

  async function logout(sessionToken: string): Promise<AuthServiceResult<void>> {
    try {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${sessionToken}`);
      await auth.api.signOut({ headers });
      logger.info("user logged out");
      return { success: true };
    } catch (error) {
      logger.error({ error }, "logout failed");
      return { success: false, error: "Logout failed.", code: "LOGOUT_FAILED" };
    }
  }

  async function verifyEmail(input: VerifyEmailInput): Promise<AuthServiceResult<VerifyEmailResult>> {
    const parsed = verifyEmailSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid token", code: "VALIDATION_ERROR" };
    }

    try {
      await auth.api.verifyEmail({
        query: {
          token: parsed.data.token,
        },
      });

      logger.info("email verified successfully");
      return { success: true, data: { verified: true } };
    } catch (error) {
      logger.error({ error }, "email verification failed");
      return { success: false, error: "Email verification failed. The token may be invalid or expired.", code: "VERIFICATION_FAILED" };
    }
  }

  async function resendVerification(email: string): Promise<AuthServiceResult<void>> {
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email,
        },
      });

      logger.info({ email }, "verification email resent");
      return { success: true };
    } catch (error) {
      logger.error({ error, email }, "failed to resend verification email");
      return { success: false, error: "Failed to send verification email.", code: "SEND_FAILED" };
    }
  }

  async function forgotPassword(email: string): Promise<AuthServiceResult<ForgotPasswordResult>> {
    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
        },
      });

      logger.info({ email }, "password reset email sent");
      return { success: true, data: { emailSent: true } };
    } catch (error) {
      logger.error({ error, email }, "forgot password failed");
      return { success: true, data: { emailSent: true } };
    }
  }

  async function resetPassword(input: ResetPasswordInput): Promise<AuthServiceResult<ResetPasswordResult>> {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" };
    }

    try {
      await auth.api.resetPassword({
        body: {
          newPassword: parsed.data.password,
          token: parsed.data.token,
        },
      });

      logger.info("password reset successful");
      return { success: true, data: { success: true } };
    } catch (error) {
      logger.error({ error }, "password reset failed");
      return { success: false, error: "Password reset failed. The token may be invalid or expired.", code: "RESET_FAILED" };
    }
  }

  return {
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
  };
}

export type AuthService = AuthServiceMethods;
