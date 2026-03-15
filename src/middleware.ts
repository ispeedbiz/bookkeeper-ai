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
  "/admin/login",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Update session and get user
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Not authenticated
  if (!user) {
    const loginUrl = pathname.startsWith("/admin")
      ? new URL("/admin/login", request.url)
      : new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // CPA routes: cpa or admin
  if (pathname.startsWith("/cpa")) {
    if (role !== "cpa" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Dashboard routes: client, cpa, or admin
  if (pathname.startsWith("/dashboard")) {
    if (role !== "client" && role !== "cpa" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
