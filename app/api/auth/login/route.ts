import { NextRequest, NextResponse } from 'next/server';
import { getBackendOriginFromRequest, decodeJwtClaims } from '@/lib/serverAuth';
import { mintJwt, setTokenCookies } from '@/lib/authSession';

/**
 * Password sign-in. Exchanges the credentials for an access token and a JWT on the server and
 * stores both as HttpOnly cookies; the response carries no token, only the user's ids and the
 * JWT's claims (roles, tenant), which page code can no longer decode itself.
 */
export async function POST(request: NextRequest) {
  let body: { userid?: string; password?: string; tenantId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 'failed', statusMessage: 'Invalid request' }, { status: 400 });
  }
  const userid = body?.userid?.trim();
  const tenantId = body?.tenantId?.trim();
  if (!userid || !body?.password || !tenantId) {
    return NextResponse.json(
      { status: 'failed', statusMessage: 'User id, password and tenant are required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${getBackendOriginFromRequest(request)}/RequestJWTToken/TokenProvider/requestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
      body: JSON.stringify({ requestToken: { registeredAppName: tenantId, userid, password: body.password } }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    const tokenResponse = data?.tokenResponse;
    const failed =
      !response.ok ||
      data?.status === 'failed' ||
      data?.status === 'error' ||
      tokenResponse?.status === 'failed' ||
      tokenResponse?.status === 'error';
    const accessToken = String(tokenResponse?.accessToken ?? '').trim();
    if (failed || !accessToken) {
      return NextResponse.json(
        { status: 'failed', statusMessage: data?.statusMessage || 'Authentication failed' },
        { status: 401 }
      );
    }

    const jwtToken = await mintJwt(request, accessToken, tenantId);
    const userUniqueID = String(tokenResponse?.userUniqueID ?? '').trim() || undefined;
    const result = NextResponse.json(
      { status: 'success', userUniqueID, userid, claims: decodeJwtClaims(jwtToken) },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
    setTokenCookies(result, request, { accessToken, jwtToken });
    return result;
  } catch (error) {
    return NextResponse.json(
      { status: 'failed', statusMessage: error instanceof Error ? error.message : 'Sign-in failed' },
      { status: 502 }
    );
  }
}
