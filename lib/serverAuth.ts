import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "@/lib/auth";
import { REGISTERED_APP_COOKIE } from "@/lib/tenant";
import { DEV_BACKEND_ORIGIN, getConfiguredBackendOrigin } from "@/lib/backendOrigin";

export function getJwtTokenFromRequest(request: NextRequest): string | null {
  try {
    return request.cookies.get(COOKIE_NAMES.JWT_TOKEN)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns a 401 response when the caller has no session JWT, otherwise null.
 * Use at the top of route handlers that act with server-held credentials.
 */
export function requireSession(request: NextRequest): NextResponse | null {
  if (getJwtTokenFromRequest(request)) return null;
  return NextResponse.json({ error: "Unauthorized", message: "Sign in required" }, { status: 401 });
}

/** Master access token used by registerscimapp / schemamapper endpoints (not JWT). */
export function getAccessTokenFromRequest(request: NextRequest): string | null {
  try {
    return request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value ?? null;
  } catch {
    return null;
  }
}

/** Cookie KeyForge sets after an external (e.g. Oracle) SSO sign-in, holding the provider's access token. */
export const OAUTH_PROVIDER_ACCESS_TOKEN_COOKIE = "OAUTH_PROVIDER_ACCESSTOKEN";

/**
 * Access token our proxies forward when the browser sent no Authorization: the OAuth provider's
 * (Oracle) access token when present, otherwise the accessToken cookie. Returns the cookie used.
 */
export function getProxyAccessToken(request: NextRequest): { token: string; cookie: string } | null {
  for (const cookie of [OAUTH_PROVIDER_ACCESS_TOKEN_COOKIE, COOKIE_NAMES.ACCESS_TOKEN]) {
    const token = request.cookies.get(cookie)?.value?.trim();
    if (token) return { token, cookie };
  }
  return null;
}

export function withAuthHeader(
  headers: HeadersInit | undefined,
  jwtToken: string | null
): HeadersInit | undefined {
  if (!jwtToken) {
    return headers;
  }

  const headerBag = new Headers(headers ?? undefined);

  if (!headerBag.has("Authorization")) {
    headerBag.set("Authorization", `Bearer ${jwtToken}`);
  }

  return headerBag;
}

/** Authorization for registerscimapp APIs — prefers access token over JWT. */
export function withRegisterScimAuthHeader(
  headers: HeadersInit | undefined,
  request: NextRequest
): HeadersInit {
  const accessToken = getAccessTokenFromRequest(request);
  const headerBag = new Headers(headers ?? undefined);
  if (accessToken) {
    headerBag.set("Authorization", `Bearer ${accessToken}`);
  }
  return headerBag;
}

/** Resolves the caller's tenant from the incoming request's registeredAppName cookie. */
export function getTenantIdFromRequest(request: NextRequest): string {
  try {
    return request.cookies.get(REGISTERED_APP_COOKIE)?.value?.trim() || "";
  } catch {
    return "";
  }
}

/** Attaches X-Tenant-Id (resolved from the incoming request) for the outbound KeyForge call. */
export function withTenantHeader(
  headers: HeadersInit | undefined,
  request: NextRequest
): HeadersInit {
  const headerBag = new Headers(headers ?? undefined);
  if (!headerBag.has("X-Tenant-Id")) {
    headerBag.set("X-Tenant-Id", getTenantIdFromRequest(request));
  }
  return headerBag;
}


/**
 * Backend origin for server-side calls: NEXT_PUBLIC_BACKEND_ORIGIN when set (e.g. Vercel), DEV_BACKEND_ORIGIN under
 * `npm run dev`, otherwise the host the user typed (from the proxy's X-Forwarded-* headers or Host), without /kfidp.
 */
export function getBackendOriginFromRequest(request: NextRequest): string {
  const configured = getConfiguredBackendOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return DEV_BACKEND_ORIGIN;
  const first = (v: string | null) => v?.split(",")[0]?.trim() || "";
  const proto = first(request.headers.get("x-forwarded-proto")) || request.nextUrl.protocol.replace(/:$/, "");
  const host = first(request.headers.get("x-forwarded-host")) || first(request.headers.get("host")) || request.nextUrl.host;
  return `${proto}://${host}`;
}
