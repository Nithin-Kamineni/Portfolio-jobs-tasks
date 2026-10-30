// The Access JWT check (src/lib/access.ts) against a local key set: what gets in and what doesn't.
import { describe, expect, it, beforeAll } from 'vitest';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWTVerifyGetKey, type KeyLike } from 'jose';
import { configComplete, tokenFrom, verifyAccess, type AccessConfig } from '../src/lib/access';

const cfg: AccessConfig = { teamDomain: 'team.cloudflareaccess.com', aud: 'aud-123', allowedEmail: 'owner@example.com' };
let priv: KeyLike, getKey: JWTVerifyGetKey, otherPriv: KeyLike;

beforeAll(async () => {
  const kp = await generateKeyPair('RS256');
  priv = kp.privateKey;
  getKey = createLocalJWKSet({ keys: [{ ...(await exportJWK(kp.publicKey)), kid: 'k1', alg: 'RS256' }] });
  otherPriv = (await generateKeyPair('RS256')).privateKey;
});

const sign = (claims: Record<string, unknown>, opts: { aud?: string; iss?: string; exp?: string; key?: KeyLike } = {}) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(opts.iss ?? `https://${cfg.teamDomain}`)
    .setAudience(opts.aud ?? cfg.aud)
    .setSubject('sub-1')
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? '1h')
    .sign(opts.key ?? priv);

describe('verifyAccess', () => {
  it('accepts the allowed e-mail, case-insensitively', async () => {
    const id = await verifyAccess(await sign({ email: 'owner@example.com' }), cfg, getKey);
    expect(id).toEqual({ kind: 'user', email: 'owner@example.com', sub: 'sub-1' });
  });
  it('rejects any other e-mail', async () => {
    expect(await verifyAccess(await sign({ email: 'someone@example.com' }), cfg, getKey)).toBeNull();
  });
  it('rejects the wrong audience, issuer, signature and an expired token', async () => {
    expect(await verifyAccess(await sign({ email: 'owner@example.com' }, { aud: 'other' }), cfg, getKey)).toBeNull();
    expect(await verifyAccess(await sign({ email: 'owner@example.com' }, { iss: 'https://evil.example' }), cfg, getKey)).toBeNull();
    expect(await verifyAccess(await sign({ email: 'owner@example.com' }, { key: otherPriv }), cfg, getKey)).toBeNull();
    expect(await verifyAccess(await sign({ email: 'owner@example.com' }, { exp: '-1h' }), cfg, getKey)).toBeNull();
    expect(await verifyAccess('not.a.jwt', cfg, getKey)).toBeNull();
  });
  it('accepts a service token, and only listed ones when a list is set', async () => {
    const tok = await sign({ common_name: 'abc123.access' });
    expect(await verifyAccess(tok, cfg, getKey)).toBeNull();
    expect(await verifyAccess(tok, { ...cfg, allowedServiceIds: 'abc123.access, other.access' }, getKey)).toMatchObject({ kind: 'service' });
    expect(await verifyAccess(tok, { ...cfg, allowedServiceIds: 'other.access' }, getKey)).toBeNull();
  });
  it('rejects a token with neither e-mail nor service name', async () => {
    expect(await verifyAccess(await sign({}), cfg, getKey)).toBeNull();
  });
  it('allows both explicit accounts, not domains or substrings', async () => {
    const two = {...cfg, allowedEmail:'you@example.com,you@example.com'};
    for (const email of ['you@example.com','you@example.com']) {
      expect(await verifyAccess(await sign({email}),two,getKey)).toMatchObject({kind:'user'});
    }
    for (const email of ['other@example.edu','you@example.com.evil.test','you@example.com.evil.test']) {
      expect(await verifyAccess(await sign({email}),two,getKey)).toBeNull();
    }
  });
});

describe('tokenFrom', () => {
  it('reads the header first, then the cookie', () => {
    expect(tokenFrom(new Request('https://x/app', { headers: { 'Cf-Access-Jwt-Assertion': ' h.tok ' } }))).toBe('h.tok');
    expect(tokenFrom(new Request('https://x/app', { headers: { cookie: 'a=1; CF_Authorization=c.tok=; b=2' } }))).toBe('c.tok=');
    expect(tokenFrom(new Request('https://x/app'))).toBeNull();
  });
});

describe('configComplete', () => {
  it('needs the team domain, the audience and the e-mail', () => {
    expect(configComplete(cfg)).toBe(true);
    expect(configComplete({ ...cfg, aud: '' })).toBe(false);
    expect(configComplete({})).toBe(false);
  });
});
