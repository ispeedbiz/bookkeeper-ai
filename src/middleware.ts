import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/lib/supabase/types";

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/login",
  "/get-started",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/payroll",
  "/onboarding",
  "/admin/login",
];

// Security headers applied to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|css|js|map)$/)
  ) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Update session and get user
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Add security headers to supabase response
  addSecurityHeaders(supabaseResponse);

  // Not authenticated
  if (!user) {
    const loginUrl = pathname.startsWith("/admin")
      ? new URL("/admin/login", request.url)
      : new URL("/login", request.url);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Fetch profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: UserRole = profile?.role || "client";

  // Admin routes: admin only
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }
  }

  // CPA routes: cpa or admin
  if (pathname.startsWith("/cpa")) {
    if (role !== "cpa" && role !== "admin") {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }
  }

  // Dashboard routes: client, cpa, or admin
  if (pathname.startsWith("/dashboard")) {
    if (role !== "client" && role !== "cpa" && role !== "admin") {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
