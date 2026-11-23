import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_BASE_URL || process.env.BACKEND_URL;

/**
 * Next.js Internal Proxy Route for Sarvam Voice Agents
 *
 * Implements: /api/sarvam/orgs/:orgId/workspaces/:workspaceId/apps/:appId/url
 *
 * Security:
 * 1. Forwards client CRM Authorization Bearer token to backend NestJS proxy.
 * 2. Restricts path strictly to documented Sarvam SDK endpoint (never an open proxy).
 * 3. Never sends or exposes SARVAM_API_KEY in client requests.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: 'Server misconfiguration: BACKEND_BASE_URL environment variable is not defined.' },
      { status: 500 },
    );
  }
  const pathParts = params.path || [];
  const pathStr = pathParts.join('/');

  // Restrict proxy forwarding strictly to documented Sarvam route pattern:
  // orgs/:orgId/workspaces/:workspaceId/apps/:appId/url
  if (
    pathParts.length !== 7 ||
    pathParts[0] !== 'orgs' ||
    pathParts[2] !== 'workspaces' ||
    pathParts[4] !== 'apps' ||
    pathParts[6] !== 'url'
  ) {
    return NextResponse.json(
      { error: 'Forbidden: Proxy route restricted strictly to official Sarvam agent URL requests.' },
      { status: 403 },
    );
  }

  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/sarvam/${pathStr}${searchParams}`;

  try {
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const cookieToken =
        request.cookies.get('acrm_token')?.value ||
        request.cookies.get('token')?.value ||
        request.cookies.get('access_token')?.value;
      if (cookieToken) {
        authHeader = `Bearer ${cookieToken}`;
      }
    }
    if (authHeader) {
      forwardHeaders['authorization'] = authHeader;
    }

    let tenantHeader = request.headers.get('x-tenant-id');
    if (!tenantHeader) {
      const cookieTenant =
        request.cookies.get('acrm_tenant_id')?.value ||
        request.cookies.get('tenant_id')?.value;
      if (cookieTenant) {
        tenantHeader = cookieTenant;
      }
    }
    if (tenantHeader) {
      forwardHeaders['x-tenant-id'] = tenantHeader;
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: forwardHeaders,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Proxy failure connecting to backend: ${err.message}` },
      { status: 502 },
    );
  }
}
