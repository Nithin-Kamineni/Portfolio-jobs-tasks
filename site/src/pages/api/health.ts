// Database health behind Access: the schema version D1 is at and a few row counts.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const counts: Record<string, number> = {};
  for (const t of ['jobs', 'contacts', 'outreach', 'runs', 'events']) {
    const row = await env.DB.prepare(`SELECT count(*) AS n FROM ${t}`).first<{ n: number }>();
    counts[t] = row?.n ?? 0;
  }
  const mig = await env.DB.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').first<{ name: string }>().catch(() => null);
  return new Response(JSON.stringify({ ok: true, migration: mig?.name ?? null, counts }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
