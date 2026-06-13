const publicRoutes = [
  "/login",
  "/register",
  "/password-reset",
  "/verify-email",
] as const;

const authRoutes = ["/login", "/register"] as const;

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  );
}

function shouldRunMiddleware(pathname: string): boolean {
  return !isStaticAsset(pathname);
}

export { publicRoutes, authRoutes, isPublicRoute, isApiRoute, isAuthRoute, isStaticAsset, shouldRunMiddleware };
