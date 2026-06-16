import { NextResponse, type NextRequest } from "next/server";

import { validateSession, setSessionHeaders } from "./lib/middleware/auth";
import { getSecurityHeaders } from "./lib/middleware/headers";
import { checkRateLimit } from "./lib/middleware/rate-limit";
import { shouldRunMiddleware, isPublicRoute, isApiRoute, isAuthRoute } from "./lib/middleware/routes";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!shouldRunMiddleware(pathname)) {
    return NextResponse.next();
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  if (isAuthRoute(pathname)) {
    const rateLimit = await checkRateLimit(ip, pathname);
    if (!rateLimit.allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          ...getSecurityHeaders(),
        },
      });
    }
  }

  const { authenticated, session } = await validateSession(request);

  if (!authenticated) {
    if (isApiRoute(pathname) && !isPublicRoute(pathname)) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...getSecurityHeaders(),
        },
      });
    }

    if (!isPublicRoute(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(getSecurityHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  if (isAuthRoute(pathname)) {
    const chatUrl = new URL("/chat", request.url);
    return NextResponse.redirect(chatUrl);
  }

  const currentSession = session;
  if (!currentSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  setSessionHeaders(response, currentSession);

  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
