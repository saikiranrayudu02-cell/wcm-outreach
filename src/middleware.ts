import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("better-auth.session_token") && !cookieHeader.includes("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const authUrl = new URL("/api/auth/get-session", request.url);
  
  try {
    const sessionRes = await fetch(authUrl.toString(), {
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!sessionRes.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await sessionRes.json();

    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = session.user.role;

    const getDashboardUrl = (r: string) => {
      if (r === "ADMIN") return "/admin/dashboard";
      if (r === "STATE_LEADER") return "/state-leader/dashboard";
      if (r === "ZONE_LEADER") return "/zone-leader/dashboard";
      return "/coordinator/dashboard";
    };

    // Route Protection mapping
    if (pathname.startsWith("/coordinator") && role !== "COORDINATOR" && role !== "LEADER") {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    if (pathname.startsWith("/state-leader") && role !== "STATE_LEADER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    if (pathname.startsWith("/zone-leader") && role !== "ZONE_LEADER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    if (pathname.startsWith("/find-people") && role !== "ADMIN" && role !== "STATE_LEADER" && role !== "ZONE_LEADER") {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    if (pathname.startsWith("/leader")) {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/coordinator/:path*",
    "/state-leader/:path*",
    "/zone-leader/:path*",
    "/leader/:path*",
    "/find-people/:path*",
    "/profile/:path*",
  ],
};
