import { NextResponse } from "next/server";

/**
 * POST /api/auth - Demo authentication endpoint.
 *
 * In production, replace with Clerk or NextAuth.js integration.
 * Supports role-based login for: client, cpa, admin, employee.
 */
export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Demo authentication - replace with real auth provider
    const demoUsers: Record<string, { name: string; role: string }> = {
      "client@demo.com": { name: "Demo Client", role: "client" },
      "cpa@demo.com": { name: "Demo CPA Firm", role: "cpa" },
      "admin@demo.com": { name: "Admin User", role: "admin" },
    };

    const user = demoUsers[email];

    if (user && password === "demo123") {
      return NextResponse.json({
        user: {
          id: `user_${Date.now()}`,
          email,
          name: user.name,
          role: role || user.role,
        },
        redirectTo:
          (role || user.role) === "cpa"
            ? "/cpa"
            : (role || user.role) === "admin"
              ? "/admin"
              : "/dashboard",
      });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
