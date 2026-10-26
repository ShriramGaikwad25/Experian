// =====================================================================
// Server-side session tokens (used by the /api/auth routes only).
//
// accessToken and jwtToken are only ever written here, as HttpOnly cookies, so
// page JavaScript (and therefore an XSS) can never read them. The browser gets
// a placeholder instead (lib/kfProxy.ts) and the token proxy adds the real
// token on the server. The JWT's claims (userid, adminRoles, tenant id) reach
// the page as plain JSON from these routes and /api/auth/session.
//
// Cookies are written as raw Set-Cookie headers: response.cookies.set keeps one
// entry per name, so it cannot set a host-only cookie and expire the same name
// on the shared domain in one response (and it drops headers appended here).
// =====================================================================

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES, extractJWTToken, sharedCookieDomain } from "@/lib/auth";
import { getBackendOriginFromRequest } from "@/lib/serverAuth";
import { REGISTERED_APP_COOKIE } from "@/lib/tenant";

/** Same lifetime the browser-set cookies had (7 days); the tokens inside expire sooner. */
const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/** Cookie names other sign-ins (external SSO) may hold the tokens under. */
export const ACCESS_TOKEN_ALIASES = [COOKIE_NAMES.ACCESS_TOKEN, "access_token", "AccessToken", "ACCESS_TOKEN"];
export const JWT_TOKEN_ALIASES = [COOKIE_NAMES.JWT_TOKEN, "jwt_token", "JwtToken", "JWT_TOKEN"];

/** Cookies that may carry the tenant: ours first, then those KeyForge sets after an external SSO sign-in. */
const TENANT_COOKIES = [REGISTERED_APP_COOKIE, "tenantId", "REGISTERED_APPNAME"];

const EXPIRED = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";

function requestHost(request: NextRequest): string {
  return request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || request.nextUrl.host;
}

function isHttps(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

/** Writes the session tokens as HttpOnly; Secure (on https); SameSite=Lax cookies on the response. */
export function setTokenCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: { accessToken?: string; jwtToken?: string }
): void {
  const attrs = `Path=/; Max-Age=${TOKEN_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${isHttps(request) ? "; Secure" : ""}`;
  const set = (name: string, value: string) =>
    response.headers.append("Set-Cookie", `${name}=${encodeURIComponent(value)}; ${attrs}`);
  if (tokens.accessToken) set(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken);
  if (tokens.jwtToken) {
    set(COOKIE_NAMES.JWT_TOKEN, tokens.jwtToken);
    // A stale copy KeyForge set on the shared domain would otherwise be sent alongside the new one.
    const domain = sharedCookieDomain(requestHost(request));
    if (domain) response.headers.append("Set-Cookie", `${COOKIE_NAMES.JWT_TOKEN}=; Path=/; ${EXPIRED}; Domain=${domain}`);
  }
}

/** Expires a cookie both host-only and on the shared domain. */
export function expireCookie(response: NextResponse, request: NextRequest, name: string): void {
  response.headers.append("Set-Cookie", `${name}=; Path=/; ${EXPIRED}`);
  const domain = sharedCookieDomain(requestHost(request));
  if (domain) response.headers.append("Set-Cookie", `${name}=; Path=/; ${EXPIRED}; Domain=${domain}`);
}

/** The tenant for token calls: the page's X-Tenant-Id, then the tenant cookies. */
export function tenantFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("x-tenant-id")?.trim();
  if (header) return header;
  for (const name of TENANT_COOKIES) {
    const cookie = request.cookies.get(name)?.value?.trim();
    if (cookie) return cookie;
  }
  try {
    const uid = JSON.parse(request.cookies.get(COOKIE_NAMES.UID_TENANT)?.value ?? "") as { tenantId?: string };
    return uid.tenantId?.trim() || null;
  } catch {
    return null;
  }
}

/** Issues a JWT for the access token (KeyForge authservice). Throws on failure. */
export async function mintJwt(request: NextRequest, accessToken: string, tenant: string): Promise<string> {
  const origin = getBackendOriginFromRequest(request);
  const response = await fetch(`${origin}/authservice/api/v1/${encodeURIComponent(tenant)}/generateJWTToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "X-Tenant-Id": tenant },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`JWT token generation failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data?.status === "failed" || data?.status === "error" || data?.valid === false) {
    throw new Error("JWT token generation returned failed status");
  }
  const jwtToken = extractJWTToken(data);
  if (!jwtToken) throw new Error("JWT token not found in response");
  return jwtToken;
}
