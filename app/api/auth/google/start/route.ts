import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_COOKIE, googleEnabled, newGoogleRequest } from "@/lib/google-auth";
import { safeNext } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?google=av", req.url), 303);
  const { url, cookie } = newGoogleRequest(safeNext(req.nextUrl.searchParams.get("next") ?? ""));
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(GOOGLE_COOKIE, cookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/google", maxAge: 600 });
  return res;
}
