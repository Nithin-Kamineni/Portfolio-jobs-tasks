// Who the request is: the first endpoint behind Access, used to verify the whole login chain
// (browser and service token) and by the CLI's `whoami`.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ locals }) =>
  new Response(JSON.stringify({ ok: true, user: locals.user ?? null, at: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
