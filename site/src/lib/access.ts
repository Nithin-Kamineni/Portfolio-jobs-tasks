// Cloudflare Access, checked again inside the Worker (the plan's defence in depth): every /app and
// /api request must carry the JWT that Access issues after a login or for a service token. Access
// itself already blocks everything else at the edge; this check covers a misconfigured policy.
//
// Pure functions, so they can be unit-tested with a local key set (tests/access.test.ts).

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface AccessConfig {
  /** The Zero Trust team domain, e.g. "<team>.cloudflareaccess.com". */
  teamDomain: string;
  /** The Access application's audience (AUD) tag. */
  aud: string;
  /** Comma-separated exact email addresses permitted to log in. */
  allowedEmail: string;
  /** Optional comma-separated client ids of the service tokens allowed on /api (empty: any token that passed Access). */
  allowedServiceIds?: string;
}

export type Identity =
  | { kind: 'user'; email: string; sub: string }
  | { kind: 'service'; serviceId: string; sub: string };

/** Header set by Access on every authenticated request; the cookie is the browser's copy of it. */
export const JWT_HEADER = 'Cf-Access-Jwt-Assertion';
export const JWT_COOKIE = 'CF_Authorization';

const keySets = new Map<string, JWTVerifyGetKey>();

/** The team's signing keys, fetched once per isolate and refreshed by jose when a key id is unknown. */
export function jwksFor(teamDomain: string): JWTVerifyGetKey {
  let ks = keySets.get(teamDomain);
  if (!ks) {
    ks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    keySets.set(teamDomain, ks);
  }
  return ks;
}

/** The Access JWT of a request: the header first, else the cookie. */
export function tokenFrom(request: Request): string | null {
  const h = request.headers.get(JWT_HEADER);
  if (h) return h.trim();
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === JWT_COOKIE && v.length) return v.join('=').trim();
  }
  return null;
}

export function configComplete(c: Partial<AccessConfig>): c is AccessConfig {
  return !!(c.teamDomain && c.aud && c.allowedEmail);
}

/**
 * Verifies the token's signature, issuer, audience and expiry, then the identity: the allowed
 * e-mail (a login) or a service token (a machine: CLI, runner, GitHub Action). Anything else → null.
 */
export async function verifyAccess(
  token: string,
  cfg: AccessConfig,
  getKey: JWTVerifyGetKey = jwksFor(cfg.teamDomain),
): Promise<Identity | null> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getKey, {
      issuer: `https://${cfg.teamDomain}`,
      audience: cfg.aud,
      algorithms: ['RS256'],
    }));
  } catch {
    return null;
  }
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email) return cfg.allowedEmail.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes(email) ? { kind: 'user', email, sub } : null;
  const serviceId = typeof payload.common_name === 'string' ? payload.common_name.trim() : '';
  if (!serviceId) return null;
  const allowed = (cfg.allowedServiceIds ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(serviceId)) return null;
  return { kind: 'service', serviceId, sub };
}
