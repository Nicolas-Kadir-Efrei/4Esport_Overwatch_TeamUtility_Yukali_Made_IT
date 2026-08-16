import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSession(req: NextRequest) {
  return Boolean(
    req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("__Host-authjs.session-token")?.value,
  );
}

/** Empêche open-redirect via callbackUrl. */
function safeCallbackPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/dashboard";
  }
  if (raw.includes("://")) return "/dashboard";
  return raw.slice(0, 200);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = hasSession(req);

  const protectedPaths = ["/dashboard", "/profile", "/teams", "/admin", "/matches"];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !loggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", safeCallbackPath(pathname));
    return NextResponse.redirect(url);
  }

  // /admin : cookie requis (contrôle rôle ADMIN côté page + actions)
  if (pathname.startsWith("/admin") && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if ((pathname === "/login" || pathname === "/register") && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/teams/:path*",
    "/admin/:path*",
    "/matches/:path*",
    "/login",
    "/register",
  ],
};
