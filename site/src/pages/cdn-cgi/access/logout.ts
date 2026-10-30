// Local preview only: on the real site Cloudflare answers /cdn-cgi/* itself (before the Worker) and
// ends the Access session. Here it ends the local preview session from /dev-login.
import type { APIRoute } from 'astro';
export const prerender = false;
export const ALL: APIRoute = ({ cookies }) => {
  if (!import.meta.env.DEV) return new Response('Not found', { status: 404 });
  cookies.delete('dev_session', { path: '/' });
  return new Response('Signed out', { status: 200, headers: { 'Cache-Control': 'no-store' } });
};
