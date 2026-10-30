#!/usr/bin/env node
// Entry point so Claude Code can run `node dashboard/cli <command>` from the repo root.
// Registers tsx (TypeScript loader) and runs cli/main.ts. Every command prints JSON.
import { register } from 'tsx/esm/api';

register();
if (process.argv[2] === 'cloud-db') await import('./cloud-db.mjs');
else await import('./main.ts');
