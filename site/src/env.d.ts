/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

/** '/cv/<file>.pdf' when public/cv/ has a PDF at build time, else null (set in astro.config.mjs). */
declare const __CV_PDF__: string | null;

declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on /app and /api after the Cloudflare Access check. */
    user?: import('./lib/access').Identity;
  }
}

// Secrets (`wrangler secret put`) and .dev.vars values are not in the generated Env; declared here.
declare namespace Cloudflare {
  interface Env {
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    ALLOWED_EMAIL?: string;
    ALLOWED_SERVICE_IDS?: string;
    /** Local development only (see .dev.vars.example). */
    DEV_USER_EMAIL?: string;
  }
}
