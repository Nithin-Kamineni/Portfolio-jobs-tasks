// Gate for the private routes. Public pages are prerendered and never reach this; /app and /api are
// rendered on demand and must present a valid Cloudflare Access JWT (src/lib/access.ts).
// Fail closed: with the Access secrets missing, every private request is refused.

import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { configComplete, tokenFrom, verifyAccess, type Identity } from './lib/access';

const PRIVATE = /^\/(app|api)(\/|$)/;

function refuse(pathname: string): Response {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' };
  if (pathname.startsWith('/api')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
  // A browser only lands here if the Access policy doesn't cover this path: say so, show nothing.
  return new Response('Private. Sign in through Cloudflare Access first.', { status: 403, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!PRIVATE.test(pathname)) return next();

  let identity: Identity | null = null;
  // Local development only: `astro dev` with DEV_USER_EMAIL in .dev.vars acts as that user, but only
  // after "signing in" at /dev-login (a session cookie), so a fresh/incognito window and Sign out
  // behave like production. The condition is a compile-time constant: production has no bypass.
  if (import.meta.env.DEV && env.DEV_USER_EMAIL) {
    if (context.cookies.get('dev_session')?.value === '1') identity = { kind: 'user', email: env.DEV_USER_EMAIL, sub: 'dev' };
    else if (pathname.startsWith('/app')) return context.redirect(`/dev-login?next=${encodeURIComponent(pathname)}`, 302);
  } else {
    const cfg = {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      aud: env.ACCESS_AUD,
      allowedEmail: env.ALLOWED_EMAIL,
      allowedServiceIds: env.ALLOWED_SERVICE_IDS,
    };
    if (configComplete(cfg)) {
      const token = tokenFrom(context.request);
      if (token) identity = await verifyAccess(token, cfg);
    }
  }
  if (!identity) return refuse(pathname);
  if (identity.kind === 'service' && pathname.startsWith('/app')) return refuse(pathname);

  // Cookie-authenticated writes must originate on this site, and use JSON.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method)) {
    const origin = context.request.headers.get('origin');
    if ((origin && origin !== context.url.origin) || context.request.headers.get('sec-fetch-site') === 'cross-site') {
      return new Response('Cross-site request refused', { status: 403 });
    }
    // The one exception: an image added to a document is sent as its raw bytes (image/*).
    const type = context.request.headers.get('content-type') ?? '';
    if (!type.startsWith('application/json') && !(pathname === '/api/ws/doc-images' && type.startsWith('image/'))) {
      return new Response('Send JSON', { status: 415 });
    }
  }

  context.locals.user = identity;
  const response = await next();
  // Document images never change (a new image gets a new id), so the browser may keep them.
  if (!(response.ok && pathname.startsWith('/api/ws/doc-images/'))) response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});
